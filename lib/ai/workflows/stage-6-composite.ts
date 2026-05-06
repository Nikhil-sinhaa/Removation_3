// ⚠️ DEPRECATED — NOT USED IN PRODUCTION ⚠️
//
// This file is a reference/design artifact and is NOT called by any active code.
// THE ACTIVE PIPELINE IS:
//   src/services/comfyBridge.js → enqueueUltraProJob()
//   src/workflows/ultraProBuilder.js → buildStage1..6()
//
// This file contains node class_types NOT confirmed installed in ComfyUI:
//   - ImageBlend (not in base ComfyUI — requires custom nodes)
//   - PreviewImage (present in ComfyUI but this stage is entirely disconnected)
//
// lib/ai/workflows/stage-6-composite.ts
// Stage 6 (REFERENCE): Final Composite & Export — CPU-only, no diffusion
// Peak VRAM: ~0 GB (all compositing on CPU via ComfyUI image nodes)


import type { Stage6Input } from './types';

/**
 * Build the ComfyUI workflow JSON for Stage 6 — Final Composite & Export.
 *
 * Merges the upscaled result with the original for before/after pairs,
 * generates preview thumbnails, and saves in multiple formats.
 *
 * No diffusion model is loaded — this is pure image compositing.
 * Can run entirely on CPU.
 */
export function createStage6CompositeWorkflow(input: Stage6Input) {
  const { upscaledImage, originalImage, maskStack } = input;
  const timestamp = Date.now();

  const workflow: Record<string, any> = {
    // ─── Node 1: Load Upscaled Image (Stage 5 output) ───────────
    '1': {
      inputs: { image: upscaledImage, upload: 'image' },
      class_type: 'LoadImage',
    },

    // ─── Node 2: Load Original Image ─────────────────────────────
    '2': {
      inputs: { image: originalImage, upload: 'image' },
      class_type: 'LoadImage',
    },

    // ─── Node 3: Save Final PNG ──────────────────────────────────
    '3': {
      inputs: {
        filename_prefix: `final-output-${timestamp}`,
        images: ['1', 0],
      },
      class_type: 'SaveImage',
    },

    // ─── Node 4: Save Before Image (for slider) ─────────────────
    '4': {
      inputs: {
        filename_prefix: `final-before-${timestamp}`,
        images: ['2', 0],
      },
      class_type: 'SaveImage',
    },

    // ─── Node 5: Create Side-by-Side Comparison ──────────────────
    // Blend at 50% for a comparison thumbnail
    '5': {
      inputs: {
        image1: ['2', 0],         // original
        image2: ['1', 0],         // final
        blend_factor: 0.5,
        blend_mode: 'normal',
      },
      class_type: 'ImageBlend',
    },

    // ─── Node 6: Save Comparison ─────────────────────────────────
    '6': {
      inputs: {
        filename_prefix: `final-comparison-${timestamp}`,
        images: ['5', 0],
      },
      class_type: 'SaveImage',
    },

    // ─── Node 7: Preview Image ───────────────────────────────────
    '7': {
      inputs: {
        images: ['1', 0],
      },
      class_type: 'PreviewImage',
    },
  };

  // ─── Optional: Merge mask stack into single visualization ──────
  if (maskStack.length > 0) {
    // Load first mask
    workflow['20'] = {
      inputs: { image: maskStack[0], upload: 'image' },
      class_type: 'LoadImage',
    };
    workflow['21'] = {
      inputs: { image: ['20', 0], channel: 'red' },
      class_type: 'ImageToMask',
    };

    // Composite additional masks
    let currentMaskNode = '21';
    maskStack.slice(1).forEach((maskPath, idx) => {
      const loadNode = `${30 + idx * 3}`;
      const convertNode = `${31 + idx * 3}`;
      const compositeNode = `${32 + idx * 3}`;

      workflow[loadNode] = {
        inputs: { image: maskPath, upload: 'image' },
        class_type: 'LoadImage',
      };
      workflow[convertNode] = {
        inputs: { image: [loadNode, 0], channel: 'red' },
        class_type: 'ImageToMask',
      };
      workflow[compositeNode] = {
        inputs: {
          destination: [currentMaskNode, 0],
          source: [convertNode, 0],
          operation: 'add',
          x: 0, y: 0,
        },
        class_type: 'MaskComposite',
      };
      currentMaskNode = compositeNode;
    });

    // Save merged mask visualization
    const finalMaskImgNode = `${30 + maskStack.length * 3}`;
    workflow[finalMaskImgNode] = {
      inputs: { mask: [currentMaskNode, 0] },
      class_type: 'MaskToImage',
    };
    workflow[`${parseInt(finalMaskImgNode) + 1}`] = {
      inputs: {
        filename_prefix: `final-mask-composite-${timestamp}`,
        images: [finalMaskImgNode, 0],
      },
      class_type: 'SaveImage',
    };
  }

  return { prompt: workflow };
}

/**
 * Parse Stage 6 output from ComfyUI history.
 */
export function parseStage6Output(
  historyOutputs: Record<string, { images?: Array<{ filename: string }> }>
): {
  finalImagePng: string;
  beforeImage: string;
  comparisonImage: string;
} {
  let finalImagePng = '';
  let beforeImage = '';
  let comparisonImage = '';

  for (const nodeId in historyOutputs) {
    const images = historyOutputs[nodeId]?.images;
    if (!images || images.length === 0) continue;
    const fn = images[0].filename;

    if (fn.includes('final-output'))      finalImagePng = fn;
    else if (fn.includes('final-before')) beforeImage = fn;
    else if (fn.includes('final-comparison')) comparisonImage = fn;
  }

  if (!finalImagePng) throw new Error('Stage 6 final output not found');

  return { finalImagePng, beforeImage, comparisonImage };
}
