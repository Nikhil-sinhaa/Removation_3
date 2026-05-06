// ⚠️ DEPRECATED — NOT USED IN PRODUCTION ⚠️
//
// This file is a reference/design artifact and is NOT called by any active code.
// THE ACTIVE PIPELINE IS:
//   src/services/comfyBridge.js → enqueueUltraProJob()
//   src/workflows/ultraProBuilder.js → buildStage1..6()
//
// This file contains node class_types NOT confirmed installed in ComfyUI:
//   - IPAdapterUnifiedLoader with 'ipadapter_file' param (invalid in current nodes)
// Stage numbering also differs from the live JS pipeline (Stage 3 here ≠ Stage 3 in live).
//
// lib/ai/workflows/stage-3-furniture.ts
// Stage 3 (REFERENCE): Furniture Compositing — IPAdapter + Masked Inpaint
// Peak VRAM: ~6.0 GB (SDXL FP8 + IPAdapter + CLIP-H + VAE)


import type { Stage3Input } from './types';

/**
 * Build the ComfyUI workflow JSON for Stage 3 — Furniture Compositing.
 *
 * Injects a specific furniture item (from product scraper or preset) into
 * the room using IPAdapter for shape/style transfer and masked inpainting
 * to blend seamlessly.
 *
 * KEY DECISIONS:
 *  - IPAdapterUnifiedLoader auto-loads both IPAdapter + CLIP Vision models
 *  - Furniture mask from Stage 1 (SAM) defines WHERE to place furniture
 *  - High denoise (0.80–0.90) because we're REPLACING the furniture region entirely
 *  - weight 0.65–0.80 on IPAdapter for strong furniture likeness
 */
export function createStage3FurnitureWorkflow(input: Stage3Input) {
  const {
    baseRedesignedImage,
    furnitureMask,
    furnitureReferenceImage,
    furnitureStyleText,
    userMaskPath,
  } = input;

  const timestamp = Date.now();

  const positivePrompt =
    `${furnitureStyleText} furniture, seamlessly placed in room, ` +
    'matching room lighting and perspective, photorealistic, high detail, ' +
    'professional interior photography, natural shadows on furniture';

  const negativePrompt =
    'floating furniture, wrong perspective, distorted proportions, ' +
    'blurry, low quality, cut-off, cropped, watermark, text, ' +
    'mismatched lighting, cartoon, unrealistic';

  const workflow: Record<string, any> = {
    // ─── Node 1: Load SDXL Base Checkpoint ───────────────────────
    '1': {
      inputs: {
        ckpt_name: 'sd_xl_base_1.0.safetensors',
      },
      class_type: 'CheckpointLoaderSimple',
    },

    // ─── Node 2: Load VAE ────────────────────────────────────────
    '2': {
      inputs: {
        vae_name: 'sdxl_vae.safetensors',
      },
      class_type: 'VAELoader',
    },

    // ─── Node 3: IPAdapter Unified Loader ────────────────────────
    // Modern loader: auto-handles IPAdapter + CLIP Vision together
    '3': {
      inputs: {
        model: ['1', 0],
        preset: 'PLUS (high strength)',
        ipadapter_file: 'ip-adapter-plus_sdxl_vit-h.safetensors',
      },
      class_type: 'IPAdapterUnifiedLoader',
    },

    // ─── Node 4: Load Base Redesigned Image (from Stage 2) ──────
    '4': {
      inputs: {
        image: baseRedesignedImage,
        upload: 'image',
      },
      class_type: 'LoadImage',
    },

    // ─── Node 5: Load Furniture Reference Image ──────────────────
    // Product image from scraper (bg-removed, 512×512)
    '5': {
      inputs: {
        image: furnitureReferenceImage,
        upload: 'image',
      },
      class_type: 'LoadImage',
    },

    // ─── Node 6: Load Furniture Mask (from Stage 1 SAM) ──────────
    '6': {
      inputs: {
        image: furnitureMask,
        upload: 'image',
      },
      class_type: 'LoadImage',
    },

    // ─── Node 7: Convert Mask Image → Mask Type ──────────────────
    '7': {
      inputs: {
        image: ['6', 0],
        channel: 'red',
      },
      class_type: 'ImageToMask',
    },

    // ─── Node 8: Apply IPAdapter (Furniture Reference) ───────────
    // High weight = strong furniture likeness
    '8': {
      inputs: {
        model: ['3', 0],           // IPAdapter-enhanced model
        ipadapter: ['3', 1],       // IPAdapter pipe
        image: ['5', 0],           // Furniture reference photo
        weight: 0.72,              // strong furniture fidelity
        weight_type: 'linear',
        start_at: 0.0,
        end_at: 0.85,
        noise: 0.15,               // slight variation for natural look
        attn_mask: ['7', 0],       // Only apply IPAdapter in furniture region
      },
      class_type: 'IPAdapterAdvanced',
    },

    // ─── Node 9: Positive Prompt ─────────────────────────────────
    '9': {
      inputs: {
        text: positivePrompt,
        clip: ['1', 1],
      },
      class_type: 'CLIPTextEncode',
    },

    // ─── Node 10: Negative Prompt ────────────────────────────────
    '10': {
      inputs: {
        text: negativePrompt,
        clip: ['1', 1],
      },
      class_type: 'CLIPTextEncode',
    },

    // ─── Node 11: VAE Encode Base Image ──────────────────────────
    '11': {
      inputs: {
        pixels: ['4', 0],
        vae: ['2', 0],
      },
      class_type: 'VAEEncode',
    },

    // ─── Node 12: Set Latent Noise Mask (furniture region only) ──
    // Only regenerate the masked furniture area
    '12': {
      inputs: {
        samples: ['11', 0],
        mask: ['7', 0],
      },
      class_type: 'SetLatentNoiseMask',
    },

    // ─── Node 13: KSampler (Inpaint) ────────────────────────────
    '13': {
      inputs: {
        seed: Math.floor(Math.random() * 2147483647),
        steps: 20,
        cfg: 6.5,
        sampler_name: 'dpmpp_2m',
        scheduler: 'karras',
        denoise: 0.85,             // high for full furniture replacement
        model: ['8', 0],           // IPAdapter-enhanced model
        positive: ['9', 0],
        negative: ['10', 0],
        latent_image: ['12', 0],   // Masked latent
      },
      class_type: 'KSampler',
    },

    // ─── Node 14: VAE Decode (Tiled) ─────────────────────────────
    '14': {
      inputs: {
        samples: ['13', 0],
        vae: ['2', 0],
        tile_size: 512,
      },
      class_type: 'VAEDecodeTiled',
    },

    // ─── Node 15: Save Result ────────────────────────────────────
    '15': {
      inputs: {
        filename_prefix: `stage3-furniture-${timestamp}`,
        images: ['14', 0],
      },
      class_type: 'SaveImage',
    },
  };

  // ─── Optional: Override mask with user-drawn mask ──────────────
  if (userMaskPath) {
    workflow['20'] = {
      inputs: { image: userMaskPath, upload: 'image' },
      class_type: 'LoadImage',
    };
    workflow['21'] = {
      inputs: { image: ['20', 0], channel: 'red' },
      class_type: 'ImageToMask',
    };
    // Composite: union of SAM furniture mask + user mask
    workflow['22'] = {
      inputs: {
        destination: ['7', 0],
        source: ['21', 0],
        operation: 'add',
        x: 0, y: 0,
      },
      class_type: 'MaskComposite',
    };
    // Re-point latent mask and IPAdapter attn_mask to merged mask
    workflow['12'].inputs.mask = ['22', 0];
    workflow['8'].inputs.attn_mask = ['22', 0];
  }

  return { prompt: workflow };
}

/**
 * Parse Stage 3 output from ComfyUI history.
 */
export function parseStage3Output(
  historyOutputs: Record<string, { images?: Array<{ filename: string }> }>
): { roomWithFurniture: string } {
  for (const nodeId in historyOutputs) {
    const images = historyOutputs[nodeId]?.images;
    if (!images || images.length === 0) continue;
    if (images[0].filename.includes('stage3-furniture')) {
      return { roomWithFurniture: images[0].filename };
    }
  }
  throw new Error('Stage 3 output not found in ComfyUI history');
}
