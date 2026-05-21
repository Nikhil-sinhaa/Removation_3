/**
 * Ceiling Changer Orchestrator
 *
 * Runs Stage 1 (ceiling mask detection) then Stage 2 (ceiling repainting)
 * using the existing ComfyUI Closed-Loop Bridge and workflow JSON files.
 *
 * Data flow:
 *   uploadedFilename ──► Stage 1 node 1 (detect ceiling mask)
 *   uploadedFilename ──► Stage 2 node 1 (image to repaint)
 *   ceiling_mask     ──► Stage 2 node 2
 *   colorPrompt      ──► Stage 2 nodes 4 & 5
 */

import { readFile } from 'fs/promises';
import path from 'path';
import { guiToApiGraph } from '../lib/comfyWorkflowConverter.js';
import { buildCeilingPrompt, CEILING_NEGATIVE_PROMPT } from '../config/ceilingChangerPrompts.js';
import CeilingChangerRun from '../models/CeilingChangerRun.js';
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
 * @param {string}   opts.colorName      - Human-readable color name (e.g. "Sky Blue")
 * @param {string}   opts.hex            - Hex code with leading # (e.g. "#87CEEB")
 * @param {string}   opts.projectId      - MongoDB Project _id
 * @param {string}   [opts.userId]       - MongoDB User _id
 * @param {function} [opts.onProgress]   - Callback({ stage: 1|2, percent: 0-100 })
 */
export async function runCeilingChanger({
  comfyFilename,
  inputImageUrl,
  colorName,
  hex,
  projectId,
  userId,
  onProgress = () => {},
}) {
  // Acquire bridge mutex (shared with Ultra-Pro and Smart Tab jobs)
  const maxWait = 300_000;
  const pollInterval = 3_000;
  let waited = 0;
  while (comfyBridge._ultraProRunning && waited < maxWait) {
    console.log(`⏳ CeilingChanger waiting for bridge mutex (${Math.round(waited / 1000)}s)…`);
    await new Promise(r => setTimeout(r, pollInterval));
    waited += pollInterval;
  }
  if (comfyBridge._ultraProRunning) {
    throw new Error('Bridge is busy. Please wait for the current generation to finish.');
  }
  comfyBridge._ultraProRunning = true;

  let run;

  try {
    const positivePrompt = buildCeilingPrompt({ colorName });
    const seed = Math.floor(Math.random() * 2 ** 32);

    // ── Create CeilingChangerRun ─────────────────────────────────────────────
    run = await CeilingChangerRun.create({
      projectId,
      userId,
      colorName,
      hex,
      inputImageUrl,
      positivePrompt,
    });

    comfyBridge.notifyFrontend('comfy:ceiling-changer:start', { projectId, runId: String(run._id) });

    // ═══ STAGE 1: Ceiling Mask Detection ════════════════════════════════════
    comfyBridge.notifyFrontend('comfy:ceiling-changer:stage', {
      projectId, stage: 1, status: 'running',
      name: 'Detecting ceiling…',
    });
    onProgress({ stage: 1, percent: 0 });

    // Load and convert Stage 1 workflow
    const stage1Json = JSON.parse(
      await readFile(path.join(WORKFLOWS_DIR, 'Stage_CeilingDetect.json'), 'utf8')
    );
    const stage1 = JSON.parse(JSON.stringify(guiToApiGraph(stage1Json))); // deep clone

    // Inject uploaded image into node 1
    stage1['1'].inputs.image = comfyFilename;

    // Submit and wait (bridge handles polling + timeout)
    const t0 = Date.now();
    const outputs1 = await comfyBridge._submitStageAndWait(stage1);
    const stage1PromptId = outputs1._promptId || null;

    // Copy outputs to ComfyUI/input so Stage 2 can load them
    await comfyBridge._copyOutputsToInput(outputs1);

    // Extract filenames keyed by prefix
    const stage1Filenames = comfyBridge._extractFilenames(outputs1, 'stage1/');
    const ceilingMaskFilename = stage1Filenames.ceiling_mask;

    console.log(`✅ Stage 1 done (${((Date.now() - t0) / 1000).toFixed(1)}s):`, stage1Filenames);

    if (!ceilingMaskFilename) {
      throw new Error('Stage 1 did not produce a ceiling_mask output');
    }

    // Copy Stage 1 outputs to public/renders
    await _copyOutputsToPublic(outputs1);

    const ceilingMaskUrl = `/renders/${_safe(ceilingMaskFilename)}`;

    await run.updateOne({
      $set: { ceilingMaskUrl },
      ...(stage1PromptId && { $push: { comfyPromptIds: stage1PromptId } }),
    });

    onProgress({ stage: 1, percent: 100 });
    comfyBridge.notifyFrontend('comfy:ceiling-changer:stage', { projectId, stage: 1, status: 'done' });

    // ── Ceiling mask coverage guard ──────────────────────────────────────────
    // If CLIPSeg/SAM failed to detect the ceiling, fail fast with a clear
    // user-facing error instead of running Stage 2 on a broken mask.
    try {
      const sharp = (await import('sharp')).default;
      const comfyInput = process.env.COMFY_INPUT || '/home/nikhil/Documents/Remo2/ComfyUI/input';
      const ceilingMaskPath = path.join(comfyInput, ceilingMaskFilename);

      const { data, info } = await sharp(ceilingMaskPath)
        .greyscale()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const totalPixels = info.width * info.height;
      let whitePixels = 0;
      for (let i = 0; i < data.length; i++) {
        if (data[i] > 128) whitePixels++;
      }

      const coveragePercent = (whitePixels / totalPixels) * 100;
      console.log(`🏛️ Ceiling mask coverage: ${coveragePercent.toFixed(1)}% ` +
                  `(${whitePixels}/${totalPixels} px) — ${ceilingMaskFilename}`);

      if (coveragePercent < 15) {
        const err = new Error(
          "Couldn't detect the ceiling in this image. Try a photo where " +
          "the ceiling is clearly visible."
        );
        err.code = 'CEILING_MASK_INSUFFICIENT_COVERAGE';
        err.coveragePercent = coveragePercent;
        err.ceilingMaskFilename = ceilingMaskFilename;
        throw err;
      }

      if (coveragePercent > 85) {
        console.warn(
          `⚠️  Ceiling mask coverage unusually high (${coveragePercent.toFixed(1)}%). ` +
          `Mask may be over-detecting non-ceiling regions. Result quality may vary.`
        );
      }
    } catch (maskCheckErr) {
      if (maskCheckErr.code === 'CEILING_MASK_INSUFFICIENT_COVERAGE') {
        throw maskCheckErr;
      }
      console.warn(`⚠️  Ceiling mask coverage check failed (non-fatal):`, maskCheckErr.message);
    }
    // ── End coverage guard ───────────────────────────────────────────────────

    await comfyBridge._flushVRAM();

    // ═══ STAGE 2: Ceiling Repainting ════════════════════════════════════════
    comfyBridge.notifyFrontend('comfy:ceiling-changer:stage', {
      projectId, stage: 2, status: 'running',
      name: `Repainting ceiling in ${colorName}…`,
    });
    onProgress({ stage: 2, percent: 0 });

    // Load and convert Stage 2 workflow
    const stage2Json = JSON.parse(
      await readFile(path.join(WORKFLOWS_DIR, 'Stage_CeilingInpaint.json'), 'utf8')
    );
    const stage2 = JSON.parse(JSON.stringify(guiToApiGraph(stage2Json))); // deep clone

    // Node 1: original room image (same as Stage 1 input)
    stage2['1'].inputs.image = comfyFilename;

    // Node 2: ceiling mask produced by Stage 1 (flat filename in ComfyUI/input/)
    stage2['2'].inputs.image = ceilingMaskFilename;

    // Node 4: positive prompt
    stage2['4'].inputs.text = positivePrompt;

    // Node 5: negative prompt
    stage2['5'].inputs.text = CEILING_NEGATIVE_PROMPT;

    // Node 8: randomize seed (keep all other sampler params unchanged)
    stage2['8'].inputs.seed = seed;
    // Remove control_after_generate so ComfyUI doesn't auto-increment the seed
    delete stage2['8'].inputs.control_after_generate;

    const t1 = Date.now();
    const outputs2 = await comfyBridge._submitStageAndWait(stage2);
    const stage2PromptId = outputs2._promptId || null;

    // Extract final output filename (node 11)
    const stage2Filenames = comfyBridge._extractFilenames(outputs2, 'stage3/');
    const outputFilename = stage2Filenames.olive_ceiling || stage2Filenames._last;

    console.log(`✅ Stage 2 done (${((Date.now() - t1) / 1000).toFixed(1)}s):`, outputFilename);

    // Copy Stage 2 output to public/renders
    await _copyOutputsToPublic(outputs2);

    const outputImageUrl = outputFilename ? `/renders/${_safe(outputFilename)}` : null;

    // ── Persist final run ────────────────────────────────────────────────────
    await run.updateOne({
      $set: { seed, outputImageUrl },
      ...(stage2PromptId && { $push: { comfyPromptIds: stage2PromptId } }),
    });

    // Update Project
    await Project.findByIdAndUpdate(projectId, {
      resultImage: outputImageUrl,
      status: 'completed',
      processingCompletedAt: new Date(),
    });

    onProgress({ stage: 2, percent: 100 });
    comfyBridge.notifyFrontend('comfy:ceiling-changer:done', {
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
    console.error('❌ Ceiling Changer failed:', error.message);

    await Project.findByIdAndUpdate(projectId, {
      status: 'failed',
      errorMessage: `Ceiling Changer error: ${error.message}`,
      processingCompletedAt: new Date(),
    }).catch(() => {});

    comfyBridge.notifyFrontend('comfy:ceiling-changer:error', {
      projectId,
      runId: run ? String(run._id) : null,
      error: error.message,
    });

    throw error;
  } finally {
    comfyBridge._ultraProRunning = false;
    if (comfyBridge.queue.length > 0) {
      setTimeout(() => comfyBridge.processQueue(), 2000);
    }
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

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
