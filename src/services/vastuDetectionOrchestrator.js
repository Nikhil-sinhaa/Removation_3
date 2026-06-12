/**
 * vastuDetectionOrchestrator.js
 *
 * Runs the 8-pass Vastu element detection workflow and returns an array of
 * DetectedElement objects ready to be passed into lib/vastu-engine.ts.
 *
 * Pipeline overview:
 *   1. Build the API-format workflow via buildVastuElementDetection().
 *   2. Submit to ComfyUI via comfyBridge._submitStageAndWait() — this
 *      internally flushes VRAM before submission; no manual flush needed.
 *   3. For each of the 8 SaveImage outputs, read the mask PNG as a Buffer
 *      (local: disk read; cloud: HTTP download from remote ComfyUI).
 *   4. Pass each buffer to extractBoundingBoxesFromMask() to get BoundingBox[].
 *   5. Map boxes to DetectedElement[] using VASTU_PASS_DEFINITIONS.
 *
 * Known limitations (v1):
 *   - Pass 2 (stove_sink): stove and sink pixels share one mask. Both 'stove'
 *     and 'sink' DetectedElements are emitted with the same bbox since kitchen-003
 *     needs both keywords. Per-pixel distinction is deferred to v2.
 *   - Pass 6 (idol_temple): 'idol' and 'temple' share one mask. Same approach —
 *     both types emitted. All pooja-category rules evaluate zone direction, not
 *     the specific object.
 *   - Pass 8 (aquarium_fountain): 'aquarium' and 'fountain' share one mask.
 *
 * Error behaviour:
 *   Any failure (ComfyUI error, missing output files, extraction failure) logs a
 *   warning and returns []. The route degrades gracefully to the pre-detection
 *   behaviour (analyzeVastu with an empty detectedElements array).
 */

import path from 'path';
import { readFile } from 'fs/promises';
import { buildVastuElementDetection, VASTU_PASS_DEFINITIONS } from '../workflows/vastuDetectionBuilder.js';
import { extractBoundingBoxesFromMask } from '../../lib/ai/vastuElementExtractor.js';
import comfyBridge from './comfyBridge.js';

const COMFY_OUTPUT = process.env.COMFY_OUTPUT || '/home/nikhil/Documents/Remo2/ComfyUI/output';

// Maps VastuElementType → English display name for the DetectedElement.name field.
const ELEMENT_DISPLAY_NAMES = {
  bed:       'Bed',
  stove:     'Stove',
  sink:      'Sink',
  mirror:    'Mirror',
  door:      'Door',
  toilet:    'Toilet',
  idol:      'Idol',
  temple:    'Temple / Mandir',
  plant:     'Indoor Plant',
  aquarium:  'Aquarium',
  fountain:  'Water Fountain',
};

// Hindi names for detected elements. Standard Hindi vocabulary — verified against
// common interior design terminology. Mark uncertain ones with a TODO if needed.
const ELEMENT_DISPLAY_NAMES_HI = {
  bed:       'पलंग',
  stove:     'गैस स्टोव',
  sink:      'सिंक',
  mirror:    'दर्पण',
  door:      'दरवाजा',
  toilet:    'शौचालय',
  idol:      'मूर्ति',
  temple:    'मंदिर',
  plant:     'इनडोर पौधा',
  aquarium:  'मछलीघर',
  fountain:  'फव्वारा',
};

// Build a SaveImage-nodeId → VASTU_PASS_DEFINITIONS entry lookup.
// SaveImage node IDs are segment nodeId + 20 (e.g. '10' → '30').
const SAVE_NODE_TO_PASS = Object.fromEntries(
  VASTU_PASS_DEFINITIONS.map(pass => [
    String(parseInt(pass.nodeId, 10) + 20),
    pass,
  ])
);

// Inline ID generator matching the pattern used in lib/vastu-engine.ts.
const generateId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ── Bridge mutex ──────────────────────────────────────────────────────────────

async function acquireMutex() {
  const maxWait = 300_000;
  const pollInterval = 3_000;
  let waited = 0;
  while (comfyBridge._ultraProRunning && waited < maxWait) {
    console.log(`⏳ VastuDetection waiting for bridge mutex (${Math.round(waited / 1000)}s)…`);
    await new Promise(r => setTimeout(r, pollInterval));
    waited += pollInterval;
  }
  if (comfyBridge._ultraProRunning) {
    throw new Error('Bridge is busy after 5 min wait. Vastu element detection skipped.');
  }
  comfyBridge._ultraProRunning = true;
}

// ── File reading helper (local + cloud) ──────────────────────────────────────

/**
 * Read a ComfyUI output image as a Buffer.
 *
 * ComfyUI history outputs include { filename, subfolder, type } per image.
 * Local mode: read from COMFY_OUTPUT/subfolder/filename on disk.
 * Cloud mode: HTTP GET /view from the remote ComfyUI via cloud-comfy-adapter.
 *
 * @param {{ filename: string, subfolder?: string }} img  - Image entry from outputs
 * @returns {Promise<Buffer>}
 */
async function readOutputImageBuffer(img) {
  const filename = img.filename || img.name;
  const subfolder = img.subfolder || '';

  const isCloud = await comfyBridge._isCloud();
  if (isCloud) {
    const adapter = await comfyBridge._cloudAdapter();
    const comfyUrl = await comfyBridge.getComfyRestUrl();
    return adapter.downloadOutputFromRemoteComfy(filename, subfolder, comfyUrl);
  }

  // Local mode: try subfolder path first, then flat fallback
  const candidates = [
    path.join(COMFY_OUTPUT, subfolder, filename),
    path.join(COMFY_OUTPUT, filename),
  ];
  for (const candidate of candidates) {
    try {
      return await readFile(candidate);
    } catch { /* try next candidate */ }
  }
  throw new Error(`Could not read output file: ${subfolder}/${filename}`);
}

// ── Main exported function ────────────────────────────────────────────────────

/**
 * Run the 8-pass Vastu element detection pipeline for a single room image.
 *
 * @param {string} imageFilename  - Filename already saved in ComfyUI/input/
 *   (use lib/ai/save-image-for-comfy.ts to save the user upload first).
 * @param {object} [opts]
 * @param {string} [opts.roomType]  - Room type hint (e.g. 'bedroom', 'kitchen').
 *   Currently passed through to buildVastuElementDetection for future threshold
 *   tuning; does not affect v1 behaviour.
 *
 * @returns {Promise<import('../../types/vastu').DetectedElement[]>}
 *   Array of detected elements with bounding boxes. Returns [] on any failure
 *   so the caller can degrade gracefully to analysis without detected elements.
 */
export async function detectVastuElements(imageFilename, opts = {}) {
  // Acquire bridge mutex to prevent overlapping ComfyUI submissions.
  // On timeout, return [] so the Vastu analysis still proceeds without elements.
  try {
    await acquireMutex();
  } catch (mutexErr) {
    console.warn(`[VastuDetection] Skipping — ${mutexErr.message}`);
    return [];
  }

  try {
    const workflow = buildVastuElementDetection(imageFilename, opts);

    const t0 = Date.now();
    console.log(`[VastuDetection] Submitting 8-pass detection for: ${imageFilename}`);

    // _submitStageAndWait flushes VRAM before submission internally.
    // No pre- or post-flush needed here since:
    //   - pre-flush: handled by _submitStageAndWait at line 1522 of comfyBridge.js
    //   - post-flush: no subsequent heavy model load follows in this orchestrator
    const outputs = await comfyBridge._submitStageAndWait(workflow);

    console.log(`[VastuDetection] ComfyUI done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

    // _copyOutputsToInput is NOT called because this is a terminal detection step —
    // no subsequent ComfyUI stage needs these mask files in the input/ directory.
    // The mask buffers are read directly for JS-side bbox extraction.

    const detectedElements = [];

    // Iterate over SaveImage outputs (node IDs 30–37)
    for (const nodeId of Object.keys(SAVE_NODE_TO_PASS)) {
      const pass = SAVE_NODE_TO_PASS[nodeId];
      const images = outputs[nodeId]?.images;

      if (!images || images.length === 0) {
        console.warn(`[VastuDetection] No output image for pass '${pass.passName}' (node ${nodeId})`);
        continue;
      }

      const img = images[0];
      let maskBuffer;
      try {
        maskBuffer = await readOutputImageBuffer(img);
      } catch (readErr) {
        console.warn(`[VastuDetection] Could not read mask for '${pass.passName}': ${readErr.message}`);
        continue;
      }

      let bboxes;
      try {
        bboxes = await extractBoundingBoxesFromMask(maskBuffer);
      } catch (extractErr) {
        console.warn(`[VastuDetection] BBox extraction failed for '${pass.passName}': ${extractErr.message}`);
        continue;
      }

      if (bboxes.length === 0) {
        // No element of this type detected in the image — normal, not an error.
        continue;
      }

      // Emit one DetectedElement per bbox × per elementType in this pass.
      //
      // Why multiple elementTypes per bbox?
      //   - 'stove' + 'sink': kitchen-003 needs both keywords in featureSet to
      //     evaluate the fire–water clash rule. Since the mask is a union, both
      //     types share the same bbox (position is an approximation for v1).
      //   - 'idol' + 'temple': pooja-category rules only care about zone direction;
      //     emitting both ensures the keyword expansion for 'temple' → ['temple','pooja']
      //     and 'idol' → ['idol','idols','pooja'] both fire correctly.
      //   - 'aquarium' + 'fountain': both are water features with identical Vastu
      //     significance; same rationale as idol/temple.
      for (const bbox of bboxes) {
        for (const elementType of pass.elementTypes) {
          detectedElements.push({
            id: generateId(`ve-${elementType}`),
            type: elementType,
            name: ELEMENT_DISPLAY_NAMES[elementType] || elementType,
            nameHi: ELEMENT_DISPLAY_NAMES_HI[elementType] || elementType,
            boundingBox: bbox,
            // 'center' is a valid VastuPosition placeholder per types/vastu.ts.
            // Phase 3 will compute actual quadrant-based position from bbox + image dims.
            position: 'center',
            direction: undefined,
            // 'not-applicable' is the correct VastuStatus placeholder per types/vastu.ts:99.
            // Will be populated after analyzeVastu scores this element.
            vastuCompliance: 'not-applicable',
            issues: [],
            issuesHi: [],
            // Fixed confidence placeholder — extractBoundingBoxesFromMask does not
            // produce a model-confidence score (it works on binary masks). The actual
            // detection confidence lives upstream in GroundingDINO; surfacing it here
            // requires persisting pass.threshold or query-specific scores (Phase 3).
            confidence: 0.7,
          });
        }
      }
    }

    console.log(`[VastuDetection] Detected ${detectedElements.length} element(s) across ${
      new Set(detectedElements.map(e => e.type)).size
    } type(s)`);

    return detectedElements;

  } catch (error) {
    // Any error (ComfyUI failure, file read error, extraction error) degrades
    // gracefully: the route still calls analyzeVastu with detectedElements: [],
    // which matches the pre-detection behaviour.
    console.warn(`[VastuDetection] Pipeline failed — proceeding without detected elements: ${error.message}`);
    return [];

  } finally {
    comfyBridge._ultraProRunning = false;
    if (comfyBridge.queue?.length > 0) {
      setTimeout(() => comfyBridge.processQueue(), 2000);
    }
  }
}
