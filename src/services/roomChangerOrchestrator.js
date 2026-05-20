/**
 * Room Changer Orchestrator
 *
 * Runs Stage 1 (scene understanding → wall mask) then Stage 3 (wall repainting)
 * using the existing ComfyUI Closed-Loop Bridge and workflow JSON files.
 *
 * Data flow:
 *   uploadedFilename ──► Stage 1 node 1 (extract wall_mask)
 *   uploadedFilename ──► Stage 3 node 1 (image to repaint)
 *   wall_mask        ──► Stage 3 node 2
 *   colorPrompt      ──► Stage 3 nodes 4 & 5
 */

import { readFile } from 'fs/promises';
import path from 'path';
import { guiToApiGraph } from '../lib/comfyWorkflowConverter.js';
import { buildWallPrompt, NEGATIVE_PROMPT } from '../config/roomChangerPrompts.js';
import RoomChangerRun from '../models/RoomChangerRun.js';
import Project from '../models/Project.js';
import comfyBridge from './comfyBridge.js';

const WORKFLOWS_DIR = path.join(process.cwd(), 'src', 'workflows');
const COMFY_OUTPUT = process.env.COMFY_OUTPUT || '/home/nikhil/Documents/Remo2/ComfyUI/output';
const PUBLIC_RENDERS = path.join(process.cwd(), 'public', 'renders');

/**
 * Main entry point.
 *
 * @param {object} opts
 * @param {string}   opts.comfyFilename  - Filename already saved in ComfyUI/input/
 * @param {string}   opts.inputImageUrl  - Public URL of the uploaded preview (/uploads/…)
 * @param {string}   opts.colorName      - Human-readable color name (e.g. "Sage Green")
 * @param {string}   opts.hex            - Hex code with leading # (e.g. "#9CAF88")
 * @param {string}   opts.projectId      - MongoDB Project _id
 * @param {string}   [opts.userId]       - MongoDB User _id
 * @param {string}   [opts.runId]        - Existing RoomChangerRun _id (retry)
 * @param {boolean}  [opts.retryStage3]  - Skip Stage 1; use saved masks from runId
 * @param {function} [opts.onProgress]   - Callback({ stage: 1|2, percent: 0-100 })
 */
export async function runRoomChanger({
  comfyFilename,
  inputImageUrl,
  colorName,
  hex,
  projectId,
  userId,
  runId,
  retryStage3 = false,
  onProgress = () => {},
}) {
  // Acquire bridge mutex (shared with Ultra-Pro and Smart Tab jobs)
  const maxWait = 300_000;
  const pollInterval = 3_000;
  let waited = 0;
  while (comfyBridge._ultraProRunning && waited < maxWait) {
    console.log(`⏳ RoomChanger waiting for bridge mutex (${Math.round(waited / 1000)}s)…`);
    await new Promise(r => setTimeout(r, pollInterval));
    waited += pollInterval;
  }
  if (comfyBridge._ultraProRunning) {
    throw new Error('Bridge is busy. Please wait for the current generation to finish.');
  }
  comfyBridge._ultraProRunning = true;

  let run;

  try {
    // ── Create or load RoomChangerRun ──────────────────────────────────────────
    if (retryStage3 && runId) {
      run = await RoomChangerRun.findById(runId);
      if (!run) throw new Error(`RoomChangerRun ${runId} not found`);
    } else {
      run = await RoomChangerRun.create({
        projectId,
        userId,
        colorName,
        hex,
        inputImageUrl,
      });
    }

    const positivePrompt = buildWallPrompt({ colorName, hex });
    const seed = Math.floor(Math.random() * 2 ** 32);

    // Reconstruct input filename for ComfyUI if null (e.g. on retry)
    const inputFilename = run.inputImageUrl ? run.inputImageUrl.split('/').pop() : 'room.png';
    const finalComfyFilename = comfyFilename || inputFilename.replace(/\.[^.]+$/, '.png');

    comfyBridge.notifyFrontend('comfy:roomchanger:start', { projectId, runId: String(run._id) });

    // ═══ STAGE 1: Scene Understanding ═══════════════════════════════════════
    let stage1Filenames;

    if (retryStage3 && run.stage1Completed && run.stage1Outputs) {
      console.log('♻️  Skipping Stage 1 — using saved masks');
      stage1Filenames = run.stage1Outputs;
      onProgress({ stage: 1, percent: 100 });
      comfyBridge.notifyFrontend('comfy:roomchanger:stage', { projectId, stage: 1, status: 'skipped' });
    } else {
      comfyBridge.notifyFrontend('comfy:roomchanger:stage', {
        projectId, stage: 1, status: 'running',
        name: 'Analyzing room (detecting walls, floor, objects)…',
      });
      onProgress({ stage: 1, percent: 0 });

      // Load and convert Stage 1 workflow
      const stage1Json = JSON.parse(
        await readFile(path.join(WORKFLOWS_DIR, 'Stage1_SceneUnderstanding_SDXL_8GB.json'), 'utf8')
      );
      const stage1 = JSON.parse(JSON.stringify(guiToApiGraph(stage1Json))); // deep clone

      // Inject uploaded image into node 1
      stage1['1'].inputs.image = finalComfyFilename;

      // Submit and wait (bridge handles polling + timeout)
      const t0 = Date.now();
      const outputs1 = await comfyBridge._submitStageAndWait(stage1);
      const stage1PromptId = outputs1._promptId || null;

      // Copy outputs to ComfyUI/input so Stage 3 can load them
      await comfyBridge._copyOutputsToInput(outputs1);

      // Extract filenames keyed by prefix
      stage1Filenames = comfyBridge._extractFilenames(outputs1, 'stage1/');

      console.log(`✅ Stage 1 done (${((Date.now() - t0) / 1000).toFixed(1)}s):`, stage1Filenames);

      // Persist Stage 1 results (enables retry)
      const wallMaskUrl   = stage1Filenames.wall_mask   ? `/renders/${_safe(stage1Filenames.wall_mask)}`   : null;
      const floorMaskUrl  = stage1Filenames.floor_mask  ? `/renders/${_safe(stage1Filenames.floor_mask)}`  : null;
      const objectMaskUrl = stage1Filenames.object_mask ? `/renders/${_safe(stage1Filenames.object_mask)}` : null;
      const emptyMaskUrl  = stage1Filenames.empty_mask  ? `/renders/${_safe(stage1Filenames.empty_mask)}`  : null;
      const depthMapUrl   = stage1Filenames.depth_map   ? `/renders/${_safe(stage1Filenames.depth_map)}`   : null;

      // Copy all Stage 1 outputs to public/renders
      await _copyOutputsToPublic(outputs1);

      await run.updateOne({
        $set: {
          wallMaskUrl, floorMaskUrl, objectMaskUrl, emptyMaskUrl, depthMapUrl,
          stage1Outputs: stage1Filenames,
          stage1Completed: true,
        },
        ...(stage1PromptId && { $push: { comfyPromptIds: stage1PromptId } }),
      });

      onProgress({ stage: 1, percent: 100 });
      comfyBridge.notifyFrontend('comfy:roomchanger:stage', { projectId, stage: 1, status: 'done' });

      await comfyBridge._flushVRAM();
    }

    // ═══ STAGE 3: Wall Repainting ═══════════════════════════════════════════
    comfyBridge.notifyFrontend('comfy:roomchanger:stage', {
      projectId, stage: 2, status: 'running',
      name: `Repainting walls in ${colorName}…`,
    });
    onProgress({ stage: 2, percent: 0 });

    // Load and convert Stage 3 workflow
    const stage3Json = JSON.parse(
      await readFile(path.join(WORKFLOWS_DIR, 'Stage3_WhiteWalls_Inpaint_SDXL_8GB.json'), 'utf8')
    );
    const stage3 = JSON.parse(JSON.stringify(guiToApiGraph(stage3Json))); // deep clone

    // Inject runtime values
    // Node 1: original room image (same as Stage 1 input — NOT a Stage 2 output)
    stage3['1'].inputs.image = finalComfyFilename;

    // Node 2: wall mask produced by Stage 1 (flat filename in ComfyUI/input/)
    const wallMaskFilename = stage1Filenames.wall_mask;
    if (!wallMaskFilename) throw new Error('Stage 1 did not produce a wall_mask output');
    stage3['2'].inputs.image = wallMaskFilename;

    // Node 4: positive prompt
    stage3['4'].inputs.text = positivePrompt;

    // Node 5: negative prompt
    stage3['5'].inputs.text = NEGATIVE_PROMPT;

    // Node 8: randomize seed (keep all other sampler params unchanged)
    stage3['8'].inputs.seed = seed;
    // Remove control_after_generate so ComfyUI doesn't try to auto-increment the seed
    delete stage3['8'].inputs.control_after_generate;

    const t1 = Date.now();
    const outputs3 = await comfyBridge._submitStageAndWait(stage3);
    const stage3PromptId = outputs3._promptId || null;

    // Extract final output filename (node 11)
    const stage3Filenames = comfyBridge._extractFilenames(outputs3, 'stage3/');
    const outputFilename = stage3Filenames.white_walls || stage3Filenames._last;

    console.log(`✅ Stage 3 done (${((Date.now() - t1) / 1000).toFixed(1)}s):`, outputFilename);

    // Copy Stage 3 output to public/renders
    await _copyOutputsToPublic(outputs3);

    const outputImageUrl = outputFilename ? `/renders/${_safe(outputFilename)}` : null;

    // ── Persist final run ──────────────────────────────────────────────────
    await run.updateOne({
      $set: { positivePrompt, seed, outputImageUrl },
      ...(stage3PromptId && { $push: { comfyPromptIds: stage3PromptId } }),
    });

    // Update Project
    await Project.findByIdAndUpdate(projectId, {
      resultImage: outputImageUrl,
      status: 'completed',
      processingCompletedAt: new Date(),
    });

    onProgress({ stage: 2, percent: 100 });
    comfyBridge.notifyFrontend('comfy:roomchanger:done', {
      projectId,
      runId: String(run._id),
      beforeUrl: inputImageUrl,
      afterUrl: outputImageUrl,
    });

    return {
      beforeUrl: inputImageUrl,
      afterUrl: outputImageUrl,
      runId: String(run._id),
    };

  } catch (error) {
    console.error('❌ Room Changer failed:', error.message);

    // Partial state already saved — Stage 1 outputs remain for retry
    await Project.findByIdAndUpdate(projectId, {
      status: 'failed',
      errorMessage: `Room Changer error: ${error.message}`,
      processingCompletedAt: new Date(),
    }).catch(() => {});

    comfyBridge.notifyFrontend('comfy:roomchanger:error', {
      projectId,
      runId: run ? String(run._id) : null,
      error: error.message,
      canRetryStage3: run?.stage1Completed ?? false,
    });

    throw error;
  } finally {
    comfyBridge._ultraProRunning = false;
    if (comfyBridge.queue.length > 0) {
      setTimeout(() => comfyBridge.processQueue(), 2000);
    }
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Replace path separators with underscores for safe filenames. */
function _safe(filename) {
  return filename.replace(/\//g, '_');
}

/**
 * Copy all output images from ComfyUI/output/ to public/renders/.
 * Searches output subdirectories and flat output root.
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
        } catch { /* try next */ }
      }
    }
  }
}
