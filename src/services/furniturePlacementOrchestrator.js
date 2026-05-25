/**
 * Furniture Placement Orchestrator
 *
 * Three-stage pipeline:
 *   Stage 1 — RMBG removes white background from furniture photo
 *   Stage 2 — Python composites furniture onto room at canvas position
 *   Stage 3 — SDXL inpaints the composited area for realistic lighting/shadows
 *
 * Uses comfyBridge._submitStageAndWait() + _copyOutputsToInput() + _extractFilenames()
 * following the established orchestrator pattern (see roomChangerOrchestrator.js).
 */

import { readFile, copyFile, writeFile, mkdir, access } from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { guiToApiGraph } from '../lib/comfyWorkflowConverter.js';
import comfyBridge, { ensureInputFile, transferComfyFile } from './comfyBridge.js';
import FurniturePlacementRun from '../models/FurniturePlacementRun.js';
import Project from '../models/Project.js';

const WORKFLOWS_DIR  = path.join(process.cwd(), 'src', 'workflows');
const COMFY_INPUT    = process.env.COMFY_INPUT  || '/home/nikhil/Documents/Remo2/ComfyUI/input';
const COMFY_OUTPUT   = process.env.COMFY_OUTPUT || '/home/nikhil/Documents/Remo2/ComfyUI/output';
const PUBLIC_RENDERS = path.join(process.cwd(), 'public', 'renders');

/**
 * Run the full furniture placement pipeline.
 *
 * @param {object} opts
 * @param {string} opts.userId
 * @param {string} opts.runId              - FurniturePlacementRun _id (used as project correlation key)
 * @param {string} opts.projectId          - Project _id
 * @param {string} opts.roomComfyFilename  - Filename in ComfyUI/input/ for the room image
 * @param {string} opts.furnitureComfyFilename - Filename in ComfyUI/input/ for furniture
 * @param {string} opts.roomImageUrl       - Public preview URL for the room
 * @param {string} opts.furnitureImageUrl  - Public preview URL for the furniture
 * @param {object} opts.placement          - { x, y, scaleX, scaleY, rotation, width, height }
 */
export async function runFurniturePlacement({
  userId,
  runId,
  projectId,
  roomComfyFilename,
  furnitureComfyFilename,
  roomImageUrl,
  furnitureImageUrl,
  placement,
}) {
  // Acquire bridge mutex (shared with Ultra-Pro, Room Changer, etc.)
  const maxWait    = 300_000;
  const pollInterval = 3_000;
  let waited = 0;
  while (comfyBridge._ultraProRunning && waited < maxWait) {
    console.log(`⏳ FurniturePlacement waiting for bridge mutex (${Math.round(waited / 1000)}s)…`);
    await new Promise(r => setTimeout(r, pollInterval));
    waited += pollInterval;
  }
  if (comfyBridge._ultraProRunning) {
    throw new Error('Bridge is busy. Please wait for the current generation to finish.');
  }
  comfyBridge._ultraProRunning = true;

  try {
    await mkdir(PUBLIC_RENDERS, { recursive: true });

    // ── STAGE 1: Remove background from furniture photo ─────────────────────
    console.log('[FurniturePlacement] Stage 1 — BG removal');
    comfyBridge.notifyFrontend('comfy:furniture-placement:progress', {
      runId, projectId, stage: 1, message: 'Removing furniture background…',
    });

    const bgWfJson = JSON.parse(
      await readFile(path.join(WORKFLOWS_DIR, 'Stage_FurnitureBGRemove.json'), 'utf8')
    );
    const bgApi = JSON.parse(JSON.stringify(guiToApiGraph(bgWfJson)));

    // Ensure both furniture image and room image are uploaded to cloud if running in cloud mode
    await ensureInputFile({
      filename: furnitureComfyFilename,
      logPrefix: '[FurniturePlacement] Furniture Image'
    });
    await ensureInputFile({
      filename: roomComfyFilename,
      logPrefix: '[FurniturePlacement] Room Image'
    });

    // Inject furniture image into the LoadImage node (id=10)
    bgApi['10'].inputs.image = furnitureComfyFilename;

    const bgOutputs = await comfyBridge._submitStageAndWait(bgApi);
    await comfyBridge._copyOutputsToInput(bgOutputs);

    // Extract the bg-removed filename
    const bgFilenames = comfyBridge._extractFilenames(bgOutputs, 'furniture-nobg/');
    const nobgFilename = bgFilenames._last;
    if (!nobgFilename) throw new Error('BG removal (Stage 1) produced no output');

    const nobgInputFilename = nobgFilename.includes('/')
      ? nobgFilename
      : `furniture-nobg/${nobgFilename}`;

    const isCloud = await comfyBridge._isCloud();
    if (isCloud) {
      // In cloud mode, download the background-removed image to the local COMFY_INPUT folder
      const baseUrl = await comfyBridge.getComfyRestUrl();
      const adapter = await comfyBridge._cloudAdapter();
      const imgBuffer = await adapter.downloadOutputFromRemoteComfy(nobgFilename, 'furniture-nobg', baseUrl);
      
      const fs = await import('fs/promises');
      await fs.mkdir(path.dirname(path.join(COMFY_INPUT, nobgInputFilename)), { recursive: true });
      await fs.writeFile(path.join(COMFY_INPUT, nobgInputFilename), imgBuffer);
      console.log(`[FurniturePlacement] Downloaded background-removed image to local COMFY_INPUT: ${nobgInputFilename}`);
    }

    // Copy to public/renders for record-keeping
    const nobgPublicName = `nobg_${runId}.png`;
    await _copyOutputToPublic(bgOutputs, nobgPublicName);
    const furnitureNoBgUrl = `/renders/${nobgPublicName}`;

    // Also ensure we can reference it without the subfolder (ComfyUI LoadImage needs flat path)
    const nobgFlatFilename = `furniture_nobg_${runId}.png`;
    await _safeFileCopy(
      path.join(COMFY_INPUT, nobgInputFilename),
      path.join(COMFY_INPUT, nobgFlatFilename)
    );

    await FurniturePlacementRun.findByIdAndUpdate(runId, { furnitureNoBgUrl });

    // ── STAGE 2: Python composite ───────────────────────────────────────────
    console.log('[FurniturePlacement] Stage 2 — Python composite');
    comfyBridge.notifyFrontend('comfy:furniture-placement:progress', {
      runId, projectId, stage: 2, message: 'Placing furniture on room…',
    });

    const roomAbsPath      = path.join(COMFY_INPUT, roomComfyFilename);
    const furnitureAbsPath = path.join(COMFY_INPUT, nobgFlatFilename);
    const compositeFilename = `composite_${runId}.png`;
    const maskFilename      = `mask_${runId}.png`;
    const compositePath    = path.join(COMFY_INPUT, compositeFilename);
    const maskPath         = path.join(COMFY_INPUT, maskFilename);

    const scriptPath = path.join(process.cwd(), 'scripts', 'composite_furniture.py');
    const cmd = [
      'python3', JSON.stringify(scriptPath),
      '--room',          JSON.stringify(roomAbsPath),
      '--furniture',     JSON.stringify(furnitureAbsPath),
      '--x',             String(placement.x  || 0),
      '--y',             String(placement.y  || 0),
      '--scale_x',       String(placement.scaleX  ?? 1.0),
      '--scale_y',       String(placement.scaleY  ?? 1.0),
      '--rotation',      String(placement.rotation ?? 0),
      '--out_composite', JSON.stringify(compositePath),
      '--out_mask',      JSON.stringify(maskPath),
    ].join(' ');

    console.log('[FurniturePlacement] Running composite script:', cmd);
    execSync(cmd, { timeout: 60_000, stdio: ['ignore', 'pipe', 'pipe'] });

    // Verify outputs exist
    await access(compositePath);
    await access(maskPath);

    // Copy to public for user-visible preview
    const compositePublicName = `composite_${runId}.png`;
    const maskPublicName      = `mask_${runId}.png`;
    await copyFile(compositePath, path.join(PUBLIC_RENDERS, compositePublicName));
    await copyFile(maskPath,      path.join(PUBLIC_RENDERS, maskPublicName));

    await FurniturePlacementRun.findByIdAndUpdate(runId, {
      compositeUrl: `/renders/${compositePublicName}`,
      maskUrl:      `/renders/${maskPublicName}`,
    });

    // ── VRAM FLUSH between Stage 1/2 and Stage 3 ──────────────────────────
    console.log('[FurniturePlacement] Flushing VRAM before SDXL...');
    try {
      if (typeof comfyBridge._flushVRAM === 'function') {
        await comfyBridge._flushVRAM();
      } else {
        // Direct ComfyUI free endpoint fallback
        const comfyUrl = await comfyBridge.getComfyRestUrl();
        await fetch(`${comfyUrl}/free`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'bypass-tunnel-reminder': 'true' },
          body: JSON.stringify({
            unload_models: true,
            free_memory: true,
          }),
        });
      }
    } catch (vramErr) {
      console.warn('[FurniturePlacement] VRAM flush failed (non-fatal):', vramErr.message);
    }
    // Give GPU time to actually free memory
    await new Promise(r => setTimeout(r, 4000));
    console.log('[FurniturePlacement] VRAM flushed ✅');

    // ── STAGE 3: SDXL Inpainting for lighting/shadow blend ─────────────────
    console.log('[FurniturePlacement] Stage 3 — SDXL inpainting');
    comfyBridge.notifyFrontend('comfy:furniture-placement:progress', {
      runId, projectId, stage: 3, message: 'AI blending lighting and shadows…',
    });

    const blendWfJson = JSON.parse(
      await readFile(path.join(WORKFLOWS_DIR, 'Stage_FurnitureBlend.json'), 'utf8')
    );
    const blendApi = JSON.parse(JSON.stringify(guiToApiGraph(blendWfJson)));

    // Ensure composite and mask images are uploaded to cloud if running in cloud mode
    await ensureInputFile({
      filename: compositeFilename,
      logPrefix: '[FurniturePlacement] Composite Image'
    });
    await ensureInputFile({
      filename: maskFilename,
      logPrefix: '[FurniturePlacement] Mask Image'
    });

    // Inject composite image (node 20) and mask image (node 21)
    blendApi['20'].inputs.image = compositeFilename;
    blendApi['21'].inputs.image = maskFilename;

    // Positive prompt
    blendApi['24'].inputs.text = [
      'furniture placed in room, natural lighting, realistic shadows,',
      'photorealistic, 8k, interior photography, perfect lighting,',
      'seamlessly integrated, professional interior design photo',
    ].join(' ');

    // Negative prompt
    blendApi['25'].inputs.text = [
      'cartoon, illustration, painting, unrealistic, floating,',
      'no shadow, bad lighting, overexposed, underexposed,',
      'blurry, low quality, artifacts, cutout, pasted',
    ].join(' ');

    // Memory-saving overrides for 8GB VRAM
    const ksamplerNodeId = Object.keys(blendApi).find(
      id => blendApi[id].class_type === 'KSampler'
    );
    if (ksamplerNodeId) {
      // Reduce steps slightly for memory savings
      blendApi[ksamplerNodeId].inputs.steps   = 20;  // was 25
      blendApi[ksamplerNodeId].inputs.denoise = 0.75;
      
      // Randomize seed — delete control_after_generate so ComfyUI doesn't auto-increment
      blendApi[ksamplerNodeId].inputs.seed = Math.floor(Math.random() * 2 ** 32);
      delete blendApi[ksamplerNodeId].inputs.control_after_generate;
    } else {
      // Fallback
      blendApi['26'].inputs.seed = Math.floor(Math.random() * 2 ** 32);
      delete blendApi['26'].inputs.control_after_generate;
    }

    // Tell ComfyUI to use tiled VAE decode (saves ~1GB)
    // Find VAEDecode node and replace with VAEDecodeTiled if available
    const vaedecodeId = Object.keys(blendApi).find(
      id => blendApi[id].class_type === 'VAEDecode'
    );
    if (vaedecodeId) {
      blendApi[vaedecodeId].class_type = 'VAEDecodeTiled';
      blendApi[vaedecodeId].inputs.tile_size = 512;
    }

    const blendOutputs = await comfyBridge._submitStageAndWait(blendApi);
    await comfyBridge._copyOutputsToInput(blendOutputs);

    // Copy result to public/renders
    const resultPublicName = `placement_result_${runId}.png`;
    await _copyOutputToPublic(blendOutputs, resultPublicName);
    const resultUrl = `/renders/${resultPublicName}`;

    // ── Persist final result ────────────────────────────────────────────────
    await FurniturePlacementRun.findByIdAndUpdate(runId, {
      resultUrl,
      status: 'done',
    });

    await Project.findByIdAndUpdate(projectId, {
      resultImage:            resultUrl,
      status:                 'completed',
      processingCompletedAt:  new Date(),
    });

    comfyBridge.notifyFrontend('comfy:furniture-placement:done', {
      runId, projectId,
      beforeUrl: roomImageUrl,
      afterUrl:  resultUrl,
    });

    console.log(`[FurniturePlacement] ✅ Done — ${resultUrl}`);
    return { beforeUrl: roomImageUrl, afterUrl: resultUrl, runId };

  } catch (err) {
    console.error('[FurniturePlacement] ❌ Error:', err.message);

    await FurniturePlacementRun.findByIdAndUpdate(runId, {
      status: 'error',
      errorMessage: err.message,
    }).catch(() => {});

    await Project.findByIdAndUpdate(projectId, {
      status: 'failed',
      errorMessage: `Furniture Placement error: ${err.message}`,
      processingCompletedAt: new Date(),
    }).catch(() => {});

    comfyBridge.notifyFrontend('comfy:furniture-placement:error', {
      runId, projectId, error: err.message,
    });

    throw err;

  } finally {
    comfyBridge._ultraProRunning = false;
    if (comfyBridge.queue.length > 0) {
      setTimeout(() => comfyBridge.processQueue(), 2000);
    }
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Copy output images from ComfyUI /output/ to public/renders/ under a given name.
 * Downloads from cloud if in cloud mode, otherwise copies local files.
 */
async function _copyOutputToPublic(outputs, destName) {
  await mkdir(PUBLIC_RENDERS, { recursive: true });

  const { resolveComfyURL } = await import('@/lib/ai/gpu-mode-router');
  const { url: comfyUrl, source } = await resolveComfyURL();

  for (const nodeId in outputs) {
    const images = outputs[nodeId]?.images;
    if (!images) continue;
    for (const img of images) {
      const filename  = img.filename || img.name;
      if (!filename) continue;
      const subfolder = img.subfolder || '';

      if (source === 'cloud') {
        try {
          const viewUrl = `${comfyUrl}/view?filename=${encodeURIComponent(filename)}&subfolder=${encodeURIComponent(subfolder)}&type=output`;
          const res = await fetch(viewUrl, { headers: { 'bypass-tunnel-reminder': 'true' } });
          if (res.ok) {
            const buf = Buffer.from(await res.arrayBuffer());
            const dest = path.join(PUBLIC_RENDERS, destName);
            await writeFile(dest, buf);
            console.log(`[FurniturePlacement] Downloaded cloud stage output to public: ${destName}`);
            return;
          }
        } catch (e) {
          console.warn(`[FurniturePlacement] Could not download cloud stage output:`, e.message);
        }
      } else {
        const candidates = [
          path.join(COMFY_OUTPUT, subfolder, filename),
          path.join(COMFY_OUTPUT, filename),
          path.join(COMFY_INPUT,  filename),
        ];
        for (const src of candidates) {
          try {
            await access(src);
            await copyFile(src, path.join(PUBLIC_RENDERS, destName));
            return; // stop after first match
          } catch { /* try next */ }
        }
      }
    }
  }
}

/**
 * Copy a file if source exists, silently skip if not.
 */
async function _safeFileCopy(src, dest) {
  try {
    await access(src);
    await copyFile(src, dest);
  } catch (err) {
    console.warn(`[FurniturePlacement] _safeFileCopy skipped (${src}): ${err.message}`);
  }
}
