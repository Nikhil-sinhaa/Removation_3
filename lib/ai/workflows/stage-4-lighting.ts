// ⚠️ DEPRECATED — NOT USED IN PRODUCTION ⚠️
//
// This file is a reference/design artifact and is NOT called by any active code.
// THE ACTIVE PIPELINE IS:
//   src/services/comfyBridge.js → enqueueUltraProJob()
//   src/workflows/ultraProBuilder.js → buildStage1..6()
//
// This file contains node class_types NOT confirmed installed in ComfyUI:
//   - ColorCorrect (ComfyUI-post-processing-nodes)
//   - ImageBlend (not in base ComfyUI)
// Stage numbering also differs from the live JS pipeline.
//
// lib/ai/workflows/stage-4-lighting.ts
// Stage 4 (REFERENCE): Lighting & Atmosphere — lightweight img2img re-light pass
// Peak VRAM: ~5.5 GB (SDXL FP8 + VAE — no ControlNet/IPAdapter)


import type { Stage4Input } from './types';
import { LIGHTING_PROMPTS, type LightingPreset } from './types';

/**
 * Build the ComfyUI workflow JSON for Stage 4 — Lighting & Atmosphere.
 *
 * Very low denoise (0.25–0.35) to only adjust tones and lighting
 * without modifying the structural content from Stages 2+3.
 * Also applies color correction via ComfyUI-post-processing-nodes.
 */
export function createStage4LightingWorkflow(input: Stage4Input) {
  const { roomWithFurniture, lightingPreset } = input;
  const timestamp = Date.now();
  const prompts = LIGHTING_PROMPTS[lightingPreset];

  const positivePrompt =
    `professional interior photography, ${prompts.positive}, ` +
    'volumetric light rays, 8K quality, magazine cover';

  const negativePrompt = prompts.negative +
    ', blurry, distorted, watermark, text, unrealistic';

  const workflow: Record<string, any> = {
    // ─── Node 1: Load SDXL Checkpoint ────────────────────────────
    '1': {
      inputs: { ckpt_name: 'sd_xl_base_1.0.safetensors' },
      class_type: 'CheckpointLoaderSimple',
    },

    // ─── Node 2: Load VAE ────────────────────────────────────────
    '2': {
      inputs: { vae_name: 'sdxl_vae.safetensors' },
      class_type: 'VAELoader',
    },

    // ─── Node 3: Load Stage 3 Result ─────────────────────────────
    '3': {
      inputs: { image: roomWithFurniture, upload: 'image' },
      class_type: 'LoadImage',
    },

    // ─── Node 4: Positive Prompt ─────────────────────────────────
    '4': {
      inputs: { text: positivePrompt, clip: ['1', 1] },
      class_type: 'CLIPTextEncode',
    },

    // ─── Node 5: Negative Prompt ─────────────────────────────────
    '5': {
      inputs: { text: negativePrompt, clip: ['1', 1] },
      class_type: 'CLIPTextEncode',
    },

    // ─── Node 6: VAE Encode ──────────────────────────────────────
    '6': {
      inputs: { pixels: ['3', 0], vae: ['2', 0] },
      class_type: 'VAEEncode',
    },

    // ─── Node 7: KSampler (very low denoise) ─────────────────────
    // 0.28 denoise = only adjust tones, lighting, atmosphere
    '7': {
      inputs: {
        seed: Math.floor(Math.random() * 2147483647),
        steps: 15,
        cfg: 5.5,
        sampler_name: 'euler_ancestral',
        scheduler: 'normal',
        denoise: 0.28,
        model: ['1', 0],
        positive: ['4', 0],
        negative: ['5', 0],
        latent_image: ['6', 0],
      },
      class_type: 'KSampler',
    },

    // ─── Node 8: VAE Decode (Tiled) ──────────────────────────────
    '8': {
      inputs: { samples: ['7', 0], vae: ['2', 0], tile_size: 512 },
      class_type: 'VAEDecodeTiled',
    },

    // ─── Node 9: Color Correction ────────────────────────────────
    // Fine-tunes white balance & warmth using ComfyUI-post-processing-nodes
    '9': {
      inputs: {
        image: ['8', 0],
        temperature: lightingPreset.includes('warm') ? 15 : (lightingPreset.includes('cool') ? -10 : 0),
        hue: 0,
        brightness: 0,
        contrast: 5,
        saturation: 5,
        gamma: 1.0,
      },
      class_type: 'ColorCorrect',
    },

    // ─── Node 10: Blend with Original (soft blend for safety) ────
    // 80% re-lit result, 20% original → safety net against artifacts
    '10': {
      inputs: {
        image1: ['3', 0],         // original (Stage 3 output)
        image2: ['9', 0],         // re-lit + color-corrected
        blend_factor: 0.82,
        blend_mode: 'normal',
      },
      class_type: 'ImageBlend',
    },

    // ─── Node 11: Save Lit Result ────────────────────────────────
    '11': {
      inputs: {
        filename_prefix: `stage4-lighting-${timestamp}`,
        images: ['10', 0],
      },
      class_type: 'SaveImage',
    },
  };

  return { prompt: workflow };
}

/**
 * Parse Stage 4 output from ComfyUI history.
 */
export function parseStage4Output(
  historyOutputs: Record<string, { images?: Array<{ filename: string }> }>
): { litRoomImage: string } {
  for (const nodeId in historyOutputs) {
    const images = historyOutputs[nodeId]?.images;
    if (!images || images.length === 0) continue;
    if (images[0].filename.includes('stage4-lighting')) {
      return { litRoomImage: images[0].filename };
    }
  }
  throw new Error('Stage 4 output not found in ComfyUI history');
}
