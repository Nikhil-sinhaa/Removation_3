// lib/ai/workflows/stage-2-redesign.ts
// Stage 2: Base Room Redesign — SDXL img2img + ControlNet LoRA structural lock
// Peak VRAM: ~5.5 GB (SDXL FP8 + ControlNet LoRA + VAE tiled)

import type { Stage2Input } from './types';

/**
 * Build the ComfyUI workflow JSON for Stage 2 — Base Room Redesign.
 *
 * Transforms room surfaces (walls, floor, ceiling, lighting mood) while
 * keeping structural layout pixel-locked via Canny ControlNet LoRA.
 *
 * KEY DECISIONS:
 *  - ControlNet LoRA (200MB) instead of full ControlNet (2.5GB) → saves 2.3GB
 *  - VAEDecodeTiled (512px tiles) → prevents OOM at 1024×1024
 *  - Denoise 0.55–0.70 → enough to transform materials, not enough to destroy structure
 *  - Optional style reference via IPAdapterAdvanced (weight 0.3–0.5)
 */
export function createStage2RedesignWorkflow(input: Stage2Input) {
  const {
    imagePath,
    cannyEdgeMap,
    masterSelector,
    masterToggles,
    styleReferenceImage,
    userMaskPath,
  } = input;

  const timestamp = Date.now();

  // ── Build dynamic prompt from master selector toggles ──────────
  const promptParts: string[] = ['professional interior photography of a modern room'];

  if (masterToggles.walls && masterSelector.wallColor) {
    promptParts.push(`${masterSelector.wallColor} painted walls`);
  }
  if (masterToggles.ceiling && masterSelector.ceiling) {
    promptParts.push(`${masterSelector.ceiling} ceiling`);
  }
  if (masterToggles.furniture && masterSelector.furnitureStyle) {
    promptParts.push(`${masterSelector.furnitureStyle} furniture`);
  }
  if (masterToggles.floor && masterSelector.floorType) {
    promptParts.push(`${masterSelector.floorType} flooring`);
  }
  if (masterToggles.lighting && masterSelector.lighting) {
    promptParts.push(`${masterSelector.lighting} lighting`);
  }
  if (masterToggles.decor && masterSelector.decorStyle) {
    promptParts.push(`${masterSelector.decorStyle} decor style`);
  }

  promptParts.push('high resolution, detailed, realistic, architectural digest quality');
  const positivePrompt = promptParts.join(', ');

  const negativePrompt =
    'blurry, low quality, distorted, watermark, text, cartoon, anime, unrealistic, ' +
    'bad architecture, plastic, fake, perspective changes, structural deformation';

  // ── Core workflow ──────────────────────────────────────────────
  const workflow: Record<string, any> = {
    // ─── Node 1: Load SDXL Base Checkpoint (FP8 via launch flag) ─
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

    // ─── Node 3: Load ControlNet LoRA ────────────────────────────
    // Using rank-128 LoRA (~200MB) instead of full ControlNet (~2.5GB)
    '3': {
      inputs: {
        control_net_name: 'control-lora-canny-rank256.safetensors',
      },
      class_type: 'ControlNetLoader',
    },

    // ─── Node 4: Load User Photo ─────────────────────────────────
    '4': {
      inputs: {
        image: imagePath,
        upload: 'image',
      },
      class_type: 'LoadImage',
    },

    // ─── Node 5: Load Canny Edge Map (from Stage 1) ─────────────
    '5': {
      inputs: {
        image: cannyEdgeMap,
        upload: 'image',
      },
      class_type: 'LoadImage',
    },

    // ─── Node 6: Positive Prompt ─────────────────────────────────
    '6': {
      inputs: {
        text: positivePrompt,
        clip: ['1', 1],
      },
      class_type: 'CLIPTextEncode',
    },

    // ─── Node 7: Negative Prompt ─────────────────────────────────
    '7': {
      inputs: {
        text: negativePrompt,
        clip: ['1', 1],
      },
      class_type: 'CLIPTextEncode',
    },

    // ─── Node 8: Apply ControlNet (Structural Lock) ──────────────
    // strength 1.2–1.5 → high structure preservation
    '8': {
      inputs: {
        positive: ['6', 0],
        negative: ['7', 0],
        control_net: ['3', 0],
        image: ['5', 0],          // Canny edge map from Stage 1
        strength: 1.3,
        start_percent: 0.0,
        end_percent: 1.0,
      },
      class_type: 'ControlNetApplyAdvanced',
    },

    // ─── Node 9: VAE Encode Input Photo ──────────────────────────
    '9': {
      inputs: {
        pixels: ['4', 0],
        vae: ['2', 0],
      },
      class_type: 'VAEEncode',
    },

    // ─── Node 10: KSampler ───────────────────────────────────────
    '10': {
      inputs: {
        seed: Math.floor(Math.random() * 2147483647),
        steps: 20,
        cfg: 7.0,
        sampler_name: 'dpmpp_2m',
        scheduler: 'karras',
        denoise: 0.62,            // sweet spot: transforms materials, preserves layout
        model: ['1', 0],
        positive: ['8', 0],       // ControlNet-conditioned positive
        negative: ['8', 1],       // ControlNet-conditioned negative
        latent_image: ['9', 0],
      },
      class_type: 'KSampler',
    },

    // ─── Node 11: VAE Decode (Tiled for VRAM safety) ─────────────
    '11': {
      inputs: {
        samples: ['10', 0],
        vae: ['2', 0],
        tile_size: 512,
      },
      class_type: 'VAEDecodeTiled',
    },

    // ─── Node 12: Save Base Redesigned Image ─────────────────────
    '12': {
      inputs: {
        filename_prefix: `stage2-base-redesign-${timestamp}`,
        images: ['11', 0],
      },
      class_type: 'SaveImage',
    },
  };

  // ─── Optional: Apply user mask for selective inpainting ────────
  // If user painted a mask, only transform the masked region
  if (userMaskPath) {
    // Load user mask
    workflow['30'] = {
      inputs: {
        image: userMaskPath,
        upload: 'image',
      },
      class_type: 'LoadImage',
    };

    // Convert to mask
    workflow['31'] = {
      inputs: {
        image: ['30', 0],
        channel: 'red',
      },
      class_type: 'ImageToMask',
    };

    // Apply mask to latent for selective inpainting
    workflow['32'] = {
      inputs: {
        samples: ['9', 0],        // VAE-encoded input
        mask: ['31', 0],
      },
      class_type: 'SetLatentNoiseMask',
    };

    // Re-point KSampler to use masked latent
    workflow['10'].inputs.latent_image = ['32', 0];
    // Increase denoise for masked inpaint (need more change in painted area)
    workflow['10'].inputs.denoise = 0.78;
  }

  // ─── Optional: Style Reference via IPAdapter ───────────────────
  // Lets user upload a Pinterest/Houzz mood-board reference
  if (styleReferenceImage) {
    // Load IPAdapter + CLIP Vision together via unified loader
    workflow['40'] = {
      inputs: {
        model: ['1', 0],
        preset: 'PLUS (high strength)',
        ipadapter_file: 'ip-adapter-plus_sdxl_vit-h.safetensors',
      },
      class_type: 'IPAdapterUnifiedLoader',
    };

    // Load style reference image
    workflow['41'] = {
      inputs: {
        image: styleReferenceImage,
        upload: 'image',
      },
      class_type: 'LoadImage',
    };

    // Apply style reference (low weight = mood, not copy)
    workflow['42'] = {
      inputs: {
        model: ['40', 0],
        ipadapter: ['40', 1],
        image: ['41', 0],
        weight: 0.40,             // subtle mood influence
        weight_type: 'style transfer',
        start_at: 0.0,
        end_at: 0.75,
        noise: 0.1,
      },
      class_type: 'IPAdapterAdvanced',
    };

    // Re-point KSampler to use IPAdapter-enhanced model
    workflow['10'].inputs.model = ['42', 0];
  }

  return { prompt: workflow };
}

/**
 * Parse Stage 2 output from ComfyUI history.
 */
export function parseStage2Output(
  historyOutputs: Record<string, { images?: Array<{ filename: string }> }>
): { baseRedesignedImage: string } {
  for (const nodeId in historyOutputs) {
    const images = historyOutputs[nodeId]?.images;
    if (!images || images.length === 0) continue;
    if (images[0].filename.includes('stage2-base-redesign')) {
      return { baseRedesignedImage: images[0].filename };
    }
  }
  throw new Error('Stage 2 output not found in ComfyUI history');
}
