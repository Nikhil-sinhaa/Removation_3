/**
 * POST /api/color-visualizer
 *
 * Accepts { imageUrl, area, color } JSON.
 * Downloads the source image, saves it to ComfyUI input, runs an img2img
 * recolor workflow synchronously, and returns { imageUrl } with the result.
 *
 * area: "wall" | "ceiling" | "floor"
 * color: hex string e.g. "#A3C4BC"
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/jwt';
import { checkAndDeductCredits } from '@/lib/ai/deductCredits';
import { tryAcquireRenderLock } from '@/lib/redis/lock';
import { saveImageForComfy } from '@/lib/ai/save-image-for-comfy';

// comfyBridge is a CommonJS singleton — import via require to preserve the singleton
// eslint-disable-next-line @typescript-eslint/no-require-imports
const comfyBridge = require('../../../src/services/comfyBridge.js');

/** Convert a hex color to an SDXL-friendly descriptive string. */
function hexToColorName(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);

  // Convert to HSL for hue-based naming
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const s = max === min ? 0 : l < 0.5 ? (max - min) / (max + min) : (max - min) / (2 - max - min);
  let hue = 0;
  if (max !== min) {
    if (max === rn) hue = ((gn - bn) / (max - min) + 6) % 6;
    else if (max === gn) hue = (bn - rn) / (max - min) + 2;
    else hue = (rn - gn) / (max - min) + 4;
    hue *= 60;
  }

  if (l < 0.12) return 'deep charcoal black';
  if (l > 0.93) return 'crisp white';
  if (s < 0.12) {
    if (l < 0.35) return 'dark grey';
    if (l < 0.65) return 'medium grey';
    return 'light grey';
  }

  const brightness = l > 0.6 ? 'light ' : l < 0.3 ? 'dark ' : '';
  if (hue < 30)   return `${brightness}warm red`;
  if (hue < 60)   return `${brightness}orange`;
  if (hue < 90)   return `${brightness}golden yellow`;
  if (hue < 150)  return `${brightness}green`;
  if (hue < 200)  return `${brightness}teal`;
  if (hue < 260)  return `${brightness}blue`;
  if (hue < 290)  return `${brightness}purple`;
  if (hue < 330)  return `${brightness}pink`;
  return `${brightness}warm red`;
}

/** Build a ComfyUI img2img workflow that recolors the target surface. */
function buildRecolorWorkflow(comfyFilename: string, colorName: string, area: string): Record<string, unknown> {
  const areaLabel = area === 'ceiling' ? 'ceiling' : area === 'floor' ? 'floor' : 'walls';
  const positive = `interior design photography, ${colorName} ${areaLabel}, matte paint finish, professional lighting, high quality, photorealistic`;
  const negative  = 'blurry, distorted, low quality, watermark, text, cartoon, anime, extra furniture';

  return {
    '1': { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: 'sd_xl_base_1.0.safetensors' } },
    '2': { class_type: 'CLIPTextEncode',          inputs: { text: positive, clip: ['1', 1] } },
    '3': { class_type: 'CLIPTextEncode',          inputs: { text: negative,  clip: ['1', 1] } },
    '4': { class_type: 'LoadImage',               inputs: { image: comfyFilename } },
    '5': { class_type: 'VAEEncode',               inputs: { pixels: ['4', 0], vae: ['1', 2] } },
    '6': {
      class_type: 'KSampler',
      inputs: {
        model: ['1', 0], positive: ['2', 0], negative: ['3', 0],
        latent_image: ['5', 0],
        seed: Math.floor(Math.random() * 2 ** 32),
        steps: 20,
        cfg: 7.0,
        sampler_name: 'dpmpp_2m',
        scheduler: 'karras',
        denoise: 0.55,
      },
    },
    '7': { class_type: 'VAEDecode', inputs: { samples: ['6', 0], vae: ['1', 2] } },
    '8': { class_type: 'SaveImage', inputs: { filename_prefix: `colorviz_${Date.now()}`, images: ['7', 0] } },
  };
}

export async function POST(req: NextRequest) {
  try {
    // Auth
    const authUser = await getCurrentUser();
    if (!authUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Credits
    const renderLock = await tryAcquireRenderLock(authUser.id, 'recolor');
    if (!renderLock) {
      return NextResponse.json({ error: 'render_in_progress', message: 'A render is already in progress for this tool. Please wait a moment.' }, { status: 429 });
    }

    const credit = await checkAndDeductCredits(authUser.id, 'recolor');
    if (!credit.success) {
      return NextResponse.json(
        { error: 'insufficient_credits', upgradeUrl: '/billing' },
        { status: 402 },
      );
    }

    const { imageUrl, area = 'wall', color = '#FFFFFF' } = await req.json() as {
      imageUrl?: string;
      area?: string;
      color?: string;
    };

    if (!imageUrl) {
      return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 });
    }

    // Download source image
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      return NextResponse.json({ error: 'Failed to download source image' }, { status: 400 });
    }
    const buffer = Buffer.from(await imgRes.arrayBuffer());

    // Save to ComfyUI input
    const filename = `colorviz_${Date.now()}_input.png`;
    const comfyFilename = await saveImageForComfy(buffer, filename);

    // Build and submit workflow
    const colorName = hexToColorName(color);
    const workflow   = buildRecolorWorkflow(comfyFilename, colorName, area);
    const outputs    = await comfyBridge.submitAndWait(workflow);

    // Copy results to public/renders
    const copied: Array<{ url: string }> = await comfyBridge.copyAllOutputsToPublic(outputs);
    const result = copied.find((r: { url: string }) => r.url && !r.url.includes('temp'));

    if (!result) {
      return NextResponse.json({ error: 'No output produced by ComfyUI' }, { status: 500 });
    }

    return NextResponse.json({ imageUrl: result.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[color-visualizer]', message);
    return NextResponse.json({ error: 'Generation failed', message }, { status: 500 });
  }
}
