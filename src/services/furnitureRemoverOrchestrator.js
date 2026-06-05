/**
 * Furniture Remover Orchestrator — Combined LaMa Pipeline
 *
 * Single exported function:
 *   runFurnitureRemover — LoadImage → ImageScale → RMBG(INSPYRENET) → LamaRemoverIMG → SaveImage (~8-15s)
 */

import { readFile } from 'fs/promises';
import path from 'path';
import { guiToApiGraph } from '../lib/comfyWorkflowConverter.js';
import FurnitureRemoverRun from '../models/FurnitureRemoverRun.js';
import Project from '../models/Project.js';
import comfyBridge from './comfyBridge.js';

const WORKFLOWS_DIR = path.join(process.cwd(), 'src', 'workflows');
const COMFY_OUTPUT = process.env.COMFY_OUTPUT || '/home/nikhil/Documents/Remo2/ComfyUI/output';
const PUBLIC_RENDERS = path.join(process.cwd(), 'public', 'renders');

// ── Mutex helper ──────────────────────────────────────────────────────────────

async function acquireMutex() {
  const maxWait = 300_000;
  const pollInterval = 3_000;
  let waited = 0;
  while (comfyBridge._ultraProRunning && waited < maxWait) {
    console.log(`⏳ FurnitureRemover waiting for bridge mutex (${Math.round(waited / 1000)}s)…`);
    await new Promise(r => setTimeout(r, pollInterval));
    waited += pollInterval;
  }
  if (comfyBridge._ultraProRunning) {
    throw new Error('Bridge is busy. Please wait for the current generation to finish.');
  }
  comfyBridge._ultraProRunning = true;
}

// ── runFurnitureRemover ───────────────────────────────────────────────────────

/**
 * Single-stage furniture removal using combined auto-detection workflow.
 *
 * @param {object} opts
 * @param {string} opts.comfyFilename      - Filename already saved in ComfyUI/input/
 * @param {string} opts.inputImageUrl      - Public URL /uploads/...
 * @param {string} opts.projectId
 * @param {string} [opts.userId]
 * @param {function} [opts.onProgress]
 * @returns {Promise<{ beforeUrl, afterUrl }>}
 */
export async function runFurnitureRemover({
  comfyFilename,
  inputImageUrl,
  projectId,
  userId = null,
  onProgress = () => {},
}) {
  await acquireMutex();

  let run;

  try {
    run = await FurnitureRemoverRun.create({
      projectId,
      userId,
      inputImageUrl,
    });

    comfyBridge.notifyFrontend('comfy:furniture-remover:start', {
      projectId,
      runId: String(run._id),
    });
    onProgress({ stage: 1, percent: 0 });

    // Load new combined workflow
    const workflowPath = path.join(process.cwd(), 'src', 'workflows', 'combinedremovernew.json');
    const guiGraph = JSON.parse(await readFile(workflowPath, 'utf8'));
    const apiGraph = guiToApiGraph(guiGraph);

    // Inject room image into LoadImage node (id: 54)
    apiGraph['54'].inputs.image = comfyFilename;

    // Randomize MiniMax seed (id: 40)
    apiGraph['40'].inputs.seed = Math.floor(Math.random() * 2 ** 32);
    // Also set control_after_generate to fixed after randomizing
    apiGraph['40'].inputs.control_after_generate = 'fixed';

    const outputNodeId = '61';

    const t0 = Date.now();
    const outputs = await comfyBridge._submitStageAndWait(apiGraph);
    const promptId = outputs._promptId || null;

    console.log(`✅ FurnitureRemover done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

    await _copyOutputsToPublic(outputs);

    // Read output from the correct SaveImage node
    const outputFilename = _firstImageFromNode(outputs, outputNodeId);

    if (!outputFilename) {
      const err = new Error('No output image was produced. Check VRAM and the workflow logs.');
      err.code = 'FURNITURE_NOT_DETECTED';
      throw err;
    }

    const outputImageUrl = `/renders/${_safe(outputFilename)}`;

    await run.updateOne({
      $set: { outputImageUrl },
      ...(promptId && { $push: { comfyPromptIds: promptId } }),
    });

    await Project.findByIdAndUpdate(projectId, {
      resultImage: outputImageUrl,
      status: 'completed',
      processingCompletedAt: new Date(),
    });

    try {
      const { notifyGenerationComplete } = await import('@/lib/notifications/send');
      await notifyGenerationComplete(userId, projectId, outputImageUrl, 'furniture-remover');
    } catch (notifErr) {
      console.error('[Notify] Generation notification failed:', notifErr);
    }

    onProgress({ stage: 1, percent: 100 });
    comfyBridge.notifyFrontend('comfy:furniture-remover:done', {
      projectId,
      runId: String(run._id),
      beforeUrl: inputImageUrl,
      afterUrl: outputImageUrl,
    });

    return {
      beforeUrl: inputImageUrl,
      afterUrl: outputImageUrl,
    };

  } catch (error) {
    console.error('❌ FurnitureRemover failed:', error.message);

    await Project.findByIdAndUpdate(projectId, {
      status: 'failed',
      errorMessage: `Furniture Remover error: ${error.message}`,
      processingCompletedAt: new Date(),
    }).catch(() => {});

    comfyBridge.notifyFrontend('comfy:furniture-remover:error', {
      projectId,
      runId: run ? String(run._id) : null,
      error: error.message,
    });

    throw error;

  } finally {
    comfyBridge._ultraProRunning = false;
    if (comfyBridge.queue?.length > 0) {
      setTimeout(() => comfyBridge.processQueue(), 2000);
    }
  }
}

/**
 * Manual erase — uses user-painted mask directly with LaMa only.
 * Fast (~2-3s). No auto-detection.
 *
 * @param {object} opts
 * @param {string} opts.comfyFilename      - Room image in ComfyUI/input/
 * @param {string} opts.comfyMaskFilename  - User mask PNG in ComfyUI/input/
 * @param {string} opts.projectId
 * @param {string} [opts.userId]
 * @param {function} [opts.onProgress]
 */
export async function runManualFurnitureErase({
  comfyFilename,
  comfyMaskFilename,
  projectId,
  userId = null,
  onProgress = () => {},
}) {
  await acquireMutex();

  let run;

  try {
    const project = await Project.findById(projectId).lean();
    const inputImageUrl = project?.originalImage || '';

    run = await FurnitureRemoverRun.create({
      projectId,
      userId,
      inputImageUrl,
    });

    comfyBridge.notifyFrontend('comfy:furniture-remover:start', {
      projectId,
      runId: String(run._id),
    });
    onProgress({ stage: 1, percent: 0 });

    // Use Stage_FurnitureErase_LaMa.json (4-node workflow)
    const workflowPath = path.join(process.cwd(), 'src', 'workflows', 'Stage_FurnitureErase_LaMa.json');
    const guiGraph = JSON.parse(await readFile(workflowPath, 'utf8'));
    const apiGraph = guiToApiGraph(guiGraph);

    // Inject filenames into LoadImage nodes
    apiGraph['1'].inputs.image = comfyFilename;
    apiGraph['2'].inputs.image = comfyMaskFilename;

    const outputNodeId = '4';

    const t0 = Date.now();
    const outputs = await comfyBridge._submitStageAndWait(apiGraph);
    const promptId = outputs._promptId || null;

    console.log(`✅ Manual FurnitureRemover done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

    await _copyOutputsToPublic(outputs);

    // Read output from the correct SaveImage node
    const outputFilename = _firstImageFromNode(outputs, outputNodeId);

    if (!outputFilename) {
      const err = new Error('No output image was produced. Check VRAM and the workflow logs.');
      err.code = 'FURNITURE_NOT_DETECTED';
      throw err;
    }

    const outputImageUrl = `/renders/${_safe(outputFilename)}`;

    await run.updateOne({
      $set: { outputImageUrl },
      ...(promptId && { $push: { comfyPromptIds: promptId } }),
    });

    await Project.findByIdAndUpdate(projectId, {
      resultImage: outputImageUrl,
      status: 'completed',
      processingCompletedAt: new Date(),
    });

    try {
      const { notifyGenerationComplete } = await import('@/lib/notifications/send');
      await notifyGenerationComplete(userId, projectId, outputImageUrl, 'furniture-remover');
    } catch (notifErr) {
      console.error('[Notify] Generation notification failed:', notifErr);
    }

    onProgress({ stage: 1, percent: 100 });
    comfyBridge.notifyFrontend('comfy:furniture-remover:done', {
      projectId,
      runId: String(run._id),
      beforeUrl: inputImageUrl,
      afterUrl: outputImageUrl,
    });

    return {
      beforeUrl: inputImageUrl,
      afterUrl: outputImageUrl,
    };

  } catch (error) {
    console.error('❌ Manual FurnitureRemover failed:', error.message);

    await Project.findByIdAndUpdate(projectId, {
      status: 'failed',
      errorMessage: `Furniture Remover error: ${error.message}`,
      processingCompletedAt: new Date(),
    }).catch(() => {});

    comfyBridge.notifyFrontend('comfy:furniture-remover:error', {
      projectId,
      runId: run ? String(run._id) : null,
      error: error.message,
    });

    throw error;

  } finally {
    comfyBridge._ultraProRunning = false;
    if (comfyBridge.queue?.length > 0) {
      setTimeout(() => comfyBridge.processQueue(), 2000);
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _safe(filename) {
  return filename.replace(/\//g, '_');
}

/**
 * Return the first output image filename from a specific node ID.
 */
function _firstImageFromNode(outputs, nodeId) {
  const images = outputs[nodeId]?.images;
  if (!images || images.length === 0) return null;
  return images[0].filename || images[0].name || null;
}

/**
 * Copy all output images from ComfyUI/output/ to public/renders/.
 */
async function _copyOutputsToPublic(outputs) {
  const { mkdir, copyFile, access } = await import('fs/promises');
  const pathMod = await import('path');
  await mkdir(PUBLIC_RENDERS, { recursive: true });

  for (const nodeId in outputs) {
    const images = outputs[nodeId]?.images;
    if (!images) continue;
    for (const img of images) {
      const filename = img.filename || img.name;
      if (!filename) continue;
      const subfolder = img.subfolder || '';
      const candidates = [
        pathMod.default.join(COMFY_OUTPUT, subfolder, filename),
        pathMod.default.join(COMFY_OUTPUT, filename),
      ];
      for (const src of candidates) {
        try {
          await access(src);
          const dest = pathMod.default.join(PUBLIC_RENDERS, _safe(filename));
          await copyFile(src, dest);
          break;
        } catch { /* try next candidate */ }
      }
    }
  }
}
