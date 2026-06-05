/**
 * saveImageForComfy
 * ─────────────────────────────────────────────────────────────────────────────
 * Saves a Sharp-processed image buffer so ComfyUI can load it.
 *
 * LOCAL mode: writes to COMFY_INPUT on disk (standard behaviour).
 * CLOUD mode: uploads directly to the remote ComfyUI via POST /upload/image
 *             so that ComfyUI's LoadImage nodes can find it.
 *
 * Returns the filename that should be passed to workflow builders.
 */

import sharp from 'sharp';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { getGPUMode, getActiveComfyBaseUrl } from '@/lib/ai/gpu-mode-router';
import { uploadImageToRemoteComfy } from '@/lib/ai/cloud-comfy-adapter';

const TARGET_LONGEST = 1024;
const MIN_LONGEST    = 768;  // images shorter than this on their longest side get upscaled

export async function saveImageForComfy(
  buffer: Buffer,
  filename: string,
  resizeOpts: { width?: number; height?: number } = { width: TARGET_LONGEST, height: TARGET_LONGEST },
): Promise<string> {
  // Resize to SDXL's operating range, then convert to PNG.
  // Images smaller than MIN_LONGEST on their longest side are upscaled with
  // Lanczos3 so SDXL doesn't run at thumbnail resolution (which causes
  // oversaturation, warped geometry, and colour bleeding).
  const meta = await sharp(buffer).metadata();
  const origW = meta.width  ?? TARGET_LONGEST;
  const origH = meta.height ?? TARGET_LONGEST;
  const longestSide = Math.max(origW, origH);

  type FitEnum = 'inside' | 'outside' | 'cover' | 'contain' | 'fill';
  type KernelEnum = 'nearest' | 'cubic' | 'mitchell' | 'lanczos2' | 'lanczos3';

  let resizeConfig: {
    width?: number; height?: number;
    fit: FitEnum; withoutEnlargement: boolean; kernel?: KernelEnum;
  };

  if (longestSide < MIN_LONGEST) {
    // Upscale small thumbnails to TARGET_LONGEST on the long side
    resizeConfig = {
      width:  origW >= origH ? TARGET_LONGEST : undefined,
      height: origH >  origW ? TARGET_LONGEST : undefined,
      fit: 'inside',
      withoutEnlargement: false,
      kernel: 'lanczos3',
    };
  } else {
    // Downscale oversized images or leave near-target images alone
    resizeConfig = {
      width:  resizeOpts.width,
      height: resizeOpts.height,
      fit: 'inside',
      withoutEnlargement: true,
    };
  }

  const processed = await sharp(buffer)
    .resize(resizeConfig)
    .png({ compressionLevel: 6 })
    .toBuffer();

  console.log(`📐 saveImageForComfy: ${origW}×${origH} → ${longestSide < MIN_LONGEST ? 'upscaled' : longestSide > TARGET_LONGEST ? 'downscaled' : 'kept'} for SDXL`);

  const mode = getGPUMode();

  if (mode === 'cloud') {
    // Upload directly to remote ComfyUI input directory
    const baseUrl = getActiveComfyBaseUrl();
    const storedName = await uploadImageToRemoteComfy(processed, filename, baseUrl);
    console.log(`☁️  Uploaded to remote ComfyUI input: ${storedName}`);
    return storedName;
  }

  // Local: write to COMFY_INPUT dir
  const comfyInputDir =
    process.env.COMFY_INPUT || '/home/nikhil/Documents/Remo2/ComfyUI/input';
  await mkdir(comfyInputDir, { recursive: true });
  await writeFile(path.join(comfyInputDir, filename), processed);
  console.log(`💾  Saved to local ComfyUI input: ${filename}`);
  return filename;
}

/**
 * Also save a preview copy to public/uploads/ for the app UI.
 * This is always local since it's served by our Next.js static folder.
 */
export async function saveUploadPreview(
  buffer: Buffer,
  filename: string,
): Promise<string> {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, filename), buffer);
  return `/uploads/${filename}`;
}
