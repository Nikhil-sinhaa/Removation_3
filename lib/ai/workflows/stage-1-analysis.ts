// lib/ai/workflows/stage-1-analysis.ts
// Stage 1: Structural Analysis & Mask Generation
// Peak VRAM: ~1.5 GB (SAM-B + YOLO-n + MiDaS + Canny — no diffusion model)

import type { Stage1Input } from './types';

/**
 * Build the ComfyUI workflow JSON for Stage 1 — Structural Analysis.
 *
 * This stage extracts:
 *  - Canny edge map (for ControlNet structural lock in Stage 2)
 *  - MiDaS depth map (optional spatial reasoning in Stage 2)
 *  - SAM-based furniture/floor/wall segmentation masks (for inpainting in Stage 3)
 *  - YOLO bounding-box detection for furniture items
 *
 * No diffusion model is loaded — only lightweight preprocessors.
 * If the user painted a mask in the editor, it's composited with SAM output.
 */
export function createStage1AnalysisWorkflow(input: Stage1Input) {
  const {
    imagePath,
    roomType,
    userMaskPath,
    resolution = 1024,
  } = input;

  const timestamp = Date.now();

  const workflow: Record<string, any> = {
    // ─── Node 1: Load Input Image ──────────────────────────────
    '1': {
      inputs: {
        image: imagePath,
        upload: 'image',
      },
      class_type: 'LoadImage',
    },

    // ─── Node 2: Canny Edge Detection ──────────────────────────
    // Produces structural edge map for Stage 2 ControlNet
    '2': {
      inputs: {
        image: ['1', 0],
        low_threshold: 100,
        high_threshold: 200,
        resolution: resolution,
      },
      class_type: 'CannyPreprocessor',
    },

    // ─── Node 3: Save Canny Edge Map ───────────────────────────
    '3': {
      inputs: {
        filename_prefix: `stage1-canny-${timestamp}`,
        images: ['2', 0],
      },
      class_type: 'SaveImage',
    },

    // ─── Node 4: MiDaS Depth Map ──────────────────────────────
    // Produces depth estimation for spatial reasoning
    // Using dpt_hybrid at 512px to minimise VRAM (vs dpt_large at 1024)
    '4': {
      inputs: {
        image: ['1', 0],
        a: 6.283185307179586,     // 2π — standard MiDaS param
        bg_threshold: 0.1,
        resolution: 512,          // half-res saves ~300 MB VRAM
      },
      class_type: 'MiDaS-DepthMapPreprocessor',
    },

    // ─── Node 5: Save Depth Map ────────────────────────────────
    '5': {
      inputs: {
        filename_prefix: `stage1-depth-${timestamp}`,
        images: ['4', 0],
      },
      class_type: 'SaveImage',
    },

    // ─── Node 6: Load SAM Model ────────────────────────────────
    // Using sam_vit_b (375 MB) — NOT sam_vit_h (2.4 GB) to stay VRAM-safe
    '6': {
      inputs: {
        model_name: 'sam_vit_b_01ec64.pth',
        device_mode: 'AUTO',      // Impact Pack manages GPU/CPU
      },
      class_type: 'SAMLoader',
    },

    // ─── Node 7: YOLO Furniture Detector ───────────────────────
    // Detects furniture bounding boxes as SEGS for SAM to refine
    '7': {
      inputs: {
        model_name: 'bbox/yolov8n.pt',
        threshold: 0.35,
        dilation: 10,             // expand bbox slightly for better SAM coverage
        crop_factor: 1.2,
        drop_size: 10,
        labels: 'couch, chair, table, bed, potted plant, tv, dining table, bench, desk, lamp, shelf, cabinet, bookcase',
        image: ['1', 0],
      },
      class_type: 'UltralyticsDetectorProvider',
    },

    // ─── Node 8: BBOX Detector to SEGS ────────────────────────
    '8': {
      inputs: {
        bbox_detector: ['7', 0],
        image: ['1', 0],
        threshold: 0.35,
        dilation: 10,
        crop_factor: 1.2,
        drop_size: 10,
      },
      class_type: 'BboxDetectorSEGS',
    },

    // ─── Node 9: SAM Segmentation (refine BBOX → precise masks) ─
    '9': {
      inputs: {
        sam_model: ['6', 0],
        segs: ['8', 0],
        image: ['1', 0],
        detection_hint: 'center-1',
        dilation: 0,
        threshold: 0.93,
        bbox_expansion: 0,
        sam_mask_hint_threshold: 0.7,
        sam_mask_hint_use_negative: 'False',
      },
      class_type: 'SAMDetectorCombined',
    },

    // ─── Node 10: Convert SEGS to combined furniture mask ──────
    '10': {
      inputs: {
        segs: ['9', 0],
      },
      class_type: 'SegsToCombinedMask',
    },

    // ─── Node 11: Mask to Image (for saving) ──────────────────
    '11': {
      inputs: {
        mask: ['10', 0],
      },
      class_type: 'MaskToImage',
    },

    // ─── Node 12: Save Furniture Mask ──────────────────────────
    '12': {
      inputs: {
        filename_prefix: `stage1-furniture-mask-${timestamp}`,
        images: ['11', 0],
      },
      class_type: 'SaveImage',
    },
  };

  // ─── Optional: Composite with user-drawn mask ──────────────────
  // If the user painted a mask in the editor, merge it with SAM output
  if (userMaskPath) {
    // Node 20: Load user-painted mask
    workflow['20'] = {
      inputs: {
        image: userMaskPath,
        upload: 'image',
      },
      class_type: 'LoadImage',
    };

    // Node 21: Convert user image to mask
    workflow['21'] = {
      inputs: {
        image: ['20', 0],
        channel: 'red', // masks are typically white-on-black
      },
      class_type: 'ImageToMask',
    };

    // Node 22: Composite — merge user mask + SAM mask (union)
    workflow['22'] = {
      inputs: {
        destination: ['10', 0],    // SAM-generated mask
        source: ['21', 0],         // User-drawn mask
        operation: 'add',          // union = include both regions
        x: 0,
        y: 0,
      },
      class_type: 'MaskComposite',
    };

    // Node 23: Convert merged mask to image
    workflow['23'] = {
      inputs: {
        mask: ['22', 0],
      },
      class_type: 'MaskToImage',
    };

    // Node 24: Save merged mask
    workflow['24'] = {
      inputs: {
        filename_prefix: `stage1-merged-mask-${timestamp}`,
        images: ['23', 0],
      },
      class_type: 'SaveImage',
    };

    // Override node 12 to also save merged version as primary output
    workflow['12'].inputs.images = ['23', 0];
  }

  return { prompt: workflow };
}

/**
 * Parse Stage 1 output filenames from ComfyUI history response.
 * Returns structured data for downstream stages.
 */
export function parseStage1Output(
  historyOutputs: Record<string, { images?: Array<{ filename: string; subfolder: string; type: string }> }>
): {
  cannyEdgeMap: string;
  depthMap: string;
  furnitureMask: string;
} {
  let cannyEdgeMap = '';
  let depthMap = '';
  let furnitureMask = '';

  for (const nodeId in historyOutputs) {
    const images = historyOutputs[nodeId]?.images;
    if (!images || images.length === 0) continue;

    const filename = images[0].filename;

    if (filename.includes('stage1-canny'))          cannyEdgeMap = filename;
    else if (filename.includes('stage1-depth'))     depthMap = filename;
    else if (filename.includes('stage1-merged-mask')) furnitureMask = filename;
    else if (filename.includes('stage1-furniture-mask') && !furnitureMask) furnitureMask = filename;
  }

  return { cannyEdgeMap, depthMap, furnitureMask };
}
