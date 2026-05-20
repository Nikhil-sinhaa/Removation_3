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

export async function saveImageForComfy(
  buffer: Buffer,
  filename: string,
  resizeOpts: { width?: number; height?: number } = { width: 1024, height: 1024 },
): Promise<string> {
  // Always resize + convert to PNG
  const processed = await sharp(buffer)
    .resize(resizeOpts.width, resizeOpts.height, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .png()
    .toBuffer();

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
