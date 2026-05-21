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
 * Single-stage furniture removal using RMBG + AILab_LamaRemover.
 * Replaces the previous two-stage detect+erase pipeline.
 *
 * @param {object} opts
 * @param {string}   opts.comfyFilename      - Filename already saved in ComfyUI/input/
 * @param {string}   [opts.maskComfyFilename] - User-painted B&W mask (manual mode). If set, skips RMBG.
 * @param {string}   opts.inputImageUrl      - Public URL /uploads/...
 * @param {string}   opts.projectId
 * @param {string}   [opts.userId]
 * @param {function} [opts.onProgress]
 * @returns {Promise<{ beforeUrl, afterUrl }>}
 */
export async function runFurnitureRemover({
  comfyFilename,
  maskComfyFilename = null,
  inputImageUrl,
  projectId,
  userId,
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

    // Branch: manual (user mask) vs auto (RMBG)
    let workflowFile, outputNodeId;

    if (maskComfyFilename) {
      // ── Manual mode: user-painted B&W mask → LamaRemoverIMG ───────────────
      console.log(`🎨 Manual mask mode — skipping RMBG, using ${maskComfyFilename}`);
      workflowFile = 'Stage_FurnitureErase_LaMa.json';
      outputNodeId = '4';
    } else {
      // ── Auto mode: RMBG detects furniture → LamaRemoverIMG ────────────────
      console.log('🤖 Auto RMBG mode');
      workflowFile = 'Stage_FurnitureRemove_Combined.json';
      outputNodeId = '8';
    }

    const workflowJson = JSON.parse(
      await readFile(path.join(WORKFLOWS_DIR, workflowFile), 'utf8')
    );
    const apiGraph = JSON.parse(JSON.stringify(guiToApiGraph(workflowJson)));

    // Inject filenames into the API graph
    apiGraph['1'].inputs.image = comfyFilename;
    if (maskComfyFilename) {
      // Manual: node 2 = mask LoadImage
      apiGraph['2'].inputs.image = maskComfyFilename;
      console.log(`  node 1 = ${comfyFilename}`);
      console.log(`  node 2 = ${maskComfyFilename}`);
    } else {
      console.log(`  node 1 = ${comfyFilename}`);
    }

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
