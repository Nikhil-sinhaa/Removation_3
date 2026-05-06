// ⚠️ DEPRECATED — NOT USED IN PRODUCTION ⚠️
//
// This file is a reference/design artifact and is NOT called by any active code.
// THE ACTIVE PIPELINE IS:
//   src/services/comfyBridge.js → enqueueUltraProJob()
//   src/workflows/ultraProBuilder.js → buildStage1..6()
//
// Stage numbering differs from the live JS pipeline (Stage 5 here = Upscale,
// but in the live pipeline Stage 5 = Refinement and Stage 6 = Upscale).
//
// lib/ai/workflows/stage-5-upscale.ts
// Stage 5 (REFERENCE): Smart Upscale — Tiled RealESRGAN + optional hires fix
// Peak VRAM: ~4.5 GB (RealESRGAN is tiny; VAE tiling handles the rest)


import type { Stage5Input } from './types';

/**
 * Build the ComfyUI workflow JSON for Stage 5 — Smart Upscale.
 *
 * Two-step process:
 *  1. RealESRGAN 4× upscale (lightweight model, ~64MB)
 *  2. Optional hires-fix KSampler pass (very low denoise 0.20–0.30)
 *     to sharpen details without regenerating content
 *
 * Tiled VAE encode/decode ensures no OOM at 2048×2048+.
 */
export function createStage5UpscaleWorkflow(input: Stage5Input) {
  const { litRoomImage, targetScale = 2 } = input;
  const timestamp = Date.now();

  // If 4× requested, we still upscale 4× then downscale to 2048 if needed
  const scaleBy = targetScale === 4 ? 4.0 : 2.0;

  const workflow: Record<string, any> = {
    // ─── Node 1: Load Stage 4 Result ─────────────────────────────
    '1': {
      inputs: { image: litRoomImage, upload: 'image' },
      class_type: 'LoadImage',
    },

    // ─── Node 2: Load Upscale Model ──────────────────────────────
    // RealESRGAN_x4plus.pth — only 64MB, extremely VRAM-friendly
    '2': {
      inputs: { model_name: 'RealESRGAN_x4plus.pth' },
      class_type: 'UpscaleModelLoader',
    },

    // ─── Node 3: Apply 4× Upscale ───────────────────────────────
    '3': {
      inputs: {
        upscale_model: ['2', 0],
        image: ['1', 0],
      },
      class_type: 'ImageUpscaleWithModel',
    },

    // ─── Node 4: Scale to Target Size ────────────────────────────
    // If targetScale is 2×, downscale the 4× result to 2×
    '4': {
      inputs: {
        image: ['3', 0],
        upscale_method: 'lanczos',
        scale_by: scaleBy === 2.0 ? 0.5 : 1.0, // 4× then ÷2 = 2× net
      },
      class_type: 'ImageScaleBy',
    },

    // ─── Node 5: Load SDXL Checkpoint (for hires fix pass) ──────
    '5': {
      inputs: { ckpt_name: 'sd_xl_base_1.0.safetensors' },
      class_type: 'CheckpointLoaderSimple',
    },

    // ─── Node 6: Load VAE ────────────────────────────────────────
    '6': {
      inputs: { vae_name: 'sdxl_vae.safetensors' },
      class_type: 'VAELoader',
    },

    // ─── Node 7: VAE Encode Tiled (high-res input) ───────────────
    // Must tile at this resolution to stay under 8GB
    '7': {
      inputs: {
        pixels: ['4', 0],
        vae: ['6', 0],
        tile_size: 512,
      },
      class_type: 'VAEEncodeTiled',
    },

    // ─── Node 8: Positive Prompt (detail enhancement) ────────────
    '8': {
      inputs: {
        text: 'sharp detailed interior photograph, ultra high resolution, ' +
              'crisp textures, fine material details, 8K photorealistic quality',
        clip: ['5', 1],
      },
      class_type: 'CLIPTextEncode',
    },

    // ─── Node 9: Negative Prompt ─────────────────────────────────
    '9': {
      inputs: {
        text: 'blurry, soft focus, low resolution, jpeg artifacts, ' +
              'noise, grain, pixelated, watermark',
        clip: ['5', 1],
      },
      class_type: 'CLIPTextEncode',
    },

    // ─── Node 10: KSampler (Hires Fix) ──────────────────────────
    // Very low denoise — only sharpens & enhances existing details
    '10': {
      inputs: {
        seed: Math.floor(Math.random() * 2147483647),
        steps: 10,
        cfg: 5.0,
        sampler_name: 'dpmpp_2m',
        scheduler: 'karras',
        denoise: 0.25,
        model: ['5', 0],
        positive: ['8', 0],
        negative: ['9', 0],
        latent_image: ['7', 0],
      },
      class_type: 'KSampler',
    },

    // ─── Node 11: VAE Decode Tiled ───────────────────────────────
    '11': {
      inputs: {
        samples: ['10', 0],
        vae: ['6', 0],
        tile_size: 512,
      },
      class_type: 'VAEDecodeTiled',
    },

    // ─── Node 12: Save Upscaled Image ────────────────────────────
    '12': {
      inputs: {
        filename_prefix: `stage5-upscale-${targetScale}x-${timestamp}`,
        images: ['11', 0],
      },
      class_type: 'SaveImage',
    },
  };

  return { prompt: workflow };
}

/**
 * Parse Stage 5 output from ComfyUI history.
 */
export function parseStage5Output(
  historyOutputs: Record<string, { images?: Array<{ filename: string }> }>
): { upscaledImage: string } {
  for (const nodeId in historyOutputs) {
    const images = historyOutputs[nodeId]?.images;
    if (!images || images.length === 0) continue;
    if (images[0].filename.includes('stage5-upscale')) {
      return { upscaledImage: images[0].filename };
    }
  }
  throw new Error('Stage 5 output not found in ComfyUI history');
}
