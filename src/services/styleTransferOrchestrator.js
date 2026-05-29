/**
 * Style Transfer Orchestrator
 *
 * Runs the style transfer workflow (IPAdapter high-weight style application + double ControlNet)
 * using the ComfyUIClosed-Loop Bridge, resolution scaling helper, and redesignff.json workflow.
 *
 * Data flow:
 *   uploadedFilename (room)  ──► Node 1 (LoadImage) & Node 6 (LoadImage)
 *   styleReference (style)   ──► Node 17 (LoadImage)
 *   dynamic aspect resolution ──► Node 11 (EmptyLatentImage)
 *   preset positive prompt   ──► Node 12 (CLIPTextEncode)
 *   preset negative prompt   ──► Node 13 (CLIPTextEncode)
 *   randomized seed          ──► Node 14 (KSampler)
 */

import { readFile, mkdir } from 'fs/promises';
import path from 'path';
import { guiToApiGraph } from '../lib/comfyWorkflowConverter.js';
import { getTargetDimensions } from '../lib/resolution-helper.js';
import { TRANSFER_PRESETS, DEFAULT_NEGATIVE_PROMPT } from '../config/transferPresetsData.js';
import StyleTransferRun from '../models/StyleTransferRun.js';
import Project from '../models/Project.js';
import comfyBridge, { ensureInputFile } from './comfyBridge.js';

const WORKFLOWS_DIR = path.join(process.cwd(), 'src', 'workflows');
const COMFY_OUTPUT = process.env.COMFY_OUTPUT || '/home/nikhil/Documents/Remo2/ComfyUI/output';
const PUBLIC_RENDERS = path.join(process.cwd(), 'public', 'renders');

/**
 * Runs a complete Style Transfer AI pipeline.
 *
 * @param {object} opts
 * @param {string}   opts.roomImageFilename - Original room image filename (already in ComfyUI/input/ or uploads)
 * @param {string}   opts.styleImageFilename - Style reference image filename
 * @param {string}   opts.inputImageUrl - Public web URL of the original room image
 * @param {string}   opts.styleImageUrl - Public web URL of the reference style image
 * @param {string}   opts.stylePresetId - ID of the selected style preset
 * @param {string}   opts.projectId - MongoDB Project _id
 * @param {string}   [opts.userId] - MongoDB User _id
 * @param {function} [opts.onProgress] - Callback function for custom progress updates
 */
export async function runStyleTransfer({
  roomImageFilename,
  styleImageFilename,
  inputImageUrl,
  styleImageUrl,
  stylePresetId,
  projectId,
  userId,
  onProgress = () => {},
}) {
  // 1. Mutex acquisition (exclusive lock for ComfyUI generation queue)
  const maxWait = 300_000;
  const pollInterval = 3_000;
  let waited = 0;
  while (comfyBridge._ultraProRunning && waited < maxWait) {
    console.log(`⏳ StyleTransfer waiting for bridge mutex (${Math.round(waited / 1000)}s)…`);
    await new Promise(r => setTimeout(r, pollInterval));
    waited += pollInterval;
  }
  if (comfyBridge._ultraProRunning) {
    throw new Error('ComfyUI Bridge is currently busy with another generation. Please try again in a moment.');
  }
  comfyBridge._ultraProRunning = true;

  let run;

  try {
    // 2. Fetch/Prepare preset config
    const preset = TRANSFER_PRESETS.find(p => p.id === stylePresetId) || TRANSFER_PRESETS[0];
    const positivePrompt = preset.prompt;
    const negativePrompt = preset.negativePrompt || DEFAULT_NEGATIVE_PROMPT;
    const seed = Math.floor(Math.random() * 2 ** 32);

    // Create the StyleTransferRun log entry in DB
    run = await StyleTransferRun.create({
      projectId,
      userId,
      stylePreset: preset.id,
      positivePrompt,
      negativePrompt,
      seed,
      inputImageUrl,
      styleImageUrl,
    });

    comfyBridge.notifyFrontend('comfy:style-transfer:start', {
      projectId,
      runId: String(run._id)
    });

    comfyBridge.notifyFrontend('comfy:style-transfer:progress', {
      projectId,
      stage: 'preparing',
      percent: 10,
      name: 'Analyzing uploaded room image metadata and scaling aspect ratios...',
    });
    onProgress({ stage: 'preparing', percent: 10 });

    // 3. Resolve dynamic resolution area based on aspect ratio
    const originalLocalPath = path.join(process.cwd(), 'public', inputImageUrl.replace(/^\//, ''));
    const { width: targetWidth, height: targetHeight } = await getTargetDimensions(originalLocalPath);

    // 4. Ensure original files exist in ComfyUI input folder
    comfyBridge.notifyFrontend('comfy:style-transfer:progress', {
      projectId,
      stage: 'uploading',
      percent: 30,
      name: 'Transferring room and style reference images to ComfyUI...',
    });
    onProgress({ stage: 'uploading', percent: 30 });

    await ensureInputFile({
      filename: roomImageFilename,
      logPrefix: '[StyleTransfer] Room Input'
    });

    await ensureInputFile({
      filename: styleImageFilename,
      logPrefix: '[StyleTransfer] Style Reference'
    });

    // 5. Load workflow and construct API graph
    comfyBridge.notifyFrontend('comfy:style-transfer:progress', {
      projectId,
      stage: 'generating',
      percent: 50,
      name: 'Applying high-weight style adaptation & generating redesign...',
    });
    onProgress({ stage: 'generating', percent: 50 });

    const workflowJson = JSON.parse(
      await readFile(path.join(WORKFLOWS_DIR, 'redesignff.json'), 'utf8')
    );
    const apiGraph = JSON.parse(JSON.stringify(guiToApiGraph(workflowJson)));

    // 6. Inject runtime parameters into API graph
    // Node 1 & Node 6: Room Image Input
    apiGraph['1'].inputs.image = roomImageFilename;
    apiGraph['6'].inputs.image = roomImageFilename;

    // Node 17: Reference Style Image Input
    apiGraph['17'].inputs.image = styleImageFilename;

    // Node 11: Dynamic Latent Dimensions
    apiGraph['11'].inputs.width = targetWidth;
    apiGraph['11'].inputs.height = targetHeight;

    // Node 12: Positive Prompt
    apiGraph['12'].inputs.text = positivePrompt;

    // Node 13: Negative Prompt
    apiGraph['13'].inputs.text = negativePrompt;

    // Node 14: KSampler Settings
    apiGraph['14'].inputs.seed = seed;
    delete apiGraph['14'].inputs.control_after_generate; // prevent auto-increments

    // 7. Submit to ComfyUI Closed-Loop Bridge and await response
    const t0 = Date.now();
    const comfyOutputs = await comfyBridge._submitStageAndWait(apiGraph);
    const comfyPromptId = comfyOutputs._promptId || null;

    console.log(`[StyleTransfer] Generation finished successfully in ${((Date.now() - t0) / 1000).toFixed(1)}s.`);

    comfyBridge.notifyFrontend('comfy:style-transfer:progress', {
      projectId,
      stage: 'finalizing',
      percent: 90,
      name: 'Redesign complete. Copying high-resolution upscaled outputs to web renders...',
    });
    onProgress({ stage: 'finalizing', percent: 90 });

    // 8. Copy generated assets to public renders
    await _copyOutputsToPublic(comfyOutputs);

    // Extract generated filenames
    const extractedFilenames = comfyBridge._extractFilenames(comfyOutputs, 'style-transfer/');
    // Node 23 is the final ESRGAN upscaled output; Node 24 is standard output.
    // Check if we have white_walls, styled, or simply fallback to last output image.
    const outputFilename = extractedFilenames.styled || extractedFilenames._last;

    if (!outputFilename) {
      throw new Error('ComfyUI completed but returned no valid output images.');
    }

    const outputImageUrl = `/renders/${_safe(outputFilename)}`;

    // 9. Persist results in MongoDB StyleTransferRun and Project
    await run.updateOne({
      $set: { outputImageUrl },
      ...(comfyPromptId && { $push: { comfyPromptIds: comfyPromptId } }),
    });

    await Project.findByIdAndUpdate(projectId, {
      resultImage: outputImageUrl,
      status: 'completed',
      processingCompletedAt: new Date(),
    });

    onProgress({ stage: 'done', percent: 100 });
    
    comfyBridge.notifyFrontend('comfy:style-transfer:done', {
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
    console.error('❌ Style Transfer failed:', error.message);

    await Project.findByIdAndUpdate(projectId, {
      status: 'failed',
      errorMessage: `Style Transfer failed: ${error.message}`,
      processingCompletedAt: new Date(),
    }).catch(() => {});

    comfyBridge.notifyFrontend('comfy:style-transfer:error', {
      projectId,
      runId: run ? String(run._id) : null,
      error: error.message,
    });

    throw error;
  } finally {
    // 10. Release bridge lock and check for remaining queued jobs
    comfyBridge._ultraProRunning = false;
    if (comfyBridge.queue.length > 0) {
      setTimeout(() => comfyBridge.processQueue(), 2000);
    }
  }
}

// ── Private Helpers ────────────────────────────────────────────────────────────

/** Replace path separators with underscores for safe filenames. */
function _safe(filename) {
  return filename.replace(/\//g, '_');
}

/**
 * Copies all generated ComfyUI outputs into `public/renders/`.
 * Supports both local development structures and cloud-hosted environments.
 */
async function _copyOutputsToPublic(outputs) {
  const { writeFile, copyFile, access } = await import('fs/promises');
  const pathMod = await import('path');
  await mkdir(PUBLIC_RENDERS, { recursive: true });

  const { resolveComfyURL } = await import('@/lib/ai/gpu-mode-router');
  const { url: comfyUrl, source } = await resolveComfyURL();

  for (const nodeId in outputs) {
    const images = outputs[nodeId]?.images;
    if (!images) continue;
    for (const img of images) {
      const filename = img.filename || img.name;
      if (!filename) continue;
      const subfolder = img.subfolder || '';

      if (source === 'cloud') {
        try {
          const viewUrl = `${comfyUrl}/view?filename=${encodeURIComponent(filename)}&subfolder=${encodeURIComponent(subfolder)}&type=output`;
          const res = await fetch(viewUrl, { headers: { 'bypass-tunnel-reminder': 'true' } });
          if (res.ok) {
            const buf = Buffer.from(await res.arrayBuffer());
            const dest = pathMod.default.join(PUBLIC_RENDERS, _safe(filename));
            await writeFile(dest, buf);
            console.log(`[StyleTransfer] Downloaded cloud stage output to public: ${filename}`);
          }
        } catch (e) {
          console.warn(`[StyleTransfer] Could not download cloud stage output:`, e.message);
        }
      } else {
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
          } catch { /* continue */ }
        }
      }
    }
  }
}
