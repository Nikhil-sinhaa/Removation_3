// lib/furniture/image-processor.ts
// Process scraped furniture images for Stage 3 IPAdapter input
// Downloads image, removes background via rembg (Python), resizes to 512×512

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ─── Config ──────────────────────────────────────────────────────────

const COMFY_INPUT_DIR = process.env.COMFY_INPUT ||
  '/home/nikhil/Documents/Remo2/ComfyUI/input';
const FURNITURE_DIR = path.join(COMFY_INPUT_DIR, 'furniture');

// Ensure directories exist
if (!fs.existsSync(FURNITURE_DIR)) {
  fs.mkdirSync(FURNITURE_DIR, { recursive: true });
}

// ─── Image Download ──────────────────────────────────────────────────

/**
 * Download a product image from URL to the ComfyUI input/furniture directory.
 */
async function downloadImage(imageUrl: string, filename: string): Promise<string> {
  const outputPath = path.join(FURNITURE_DIR, filename);

  const response = await axios.get(imageUrl, {
    responseType: 'arraybuffer',
    timeout: 30_000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      'Referer': new URL(imageUrl).origin,
    },
  });

  fs.writeFileSync(outputPath, Buffer.from(response.data));
  console.log(`📥 Downloaded: ${filename} (${(response.data.byteLength / 1024).toFixed(0)} KB)`);

  return outputPath;
}

// ─── Background Removal ──────────────────────────────────────────────

/**
 * Gap 5 fix: Pre-check rembg availability once at startup.
 * Avoids 60s CLI timeout on every image if not installed.
 */
let _rembgAvailable: boolean | null = null;

async function checkRembg(): Promise<boolean> {
  if (_rembgAvailable !== null) return _rembgAvailable;
  try {
    await execAsync('python -m rembg --help', { timeout: 10_000 });
    _rembgAvailable = true;
    console.log('✅ rembg is available (CPU mode)');
  } catch {
    _rembgAvailable = false;
    console.warn('⚠️ rembg NOT installed. Furniture images will keep their background.');
    console.warn('   Install with: pip install rembg[cpu] onnxruntime Pillow');
  }
  return _rembgAvailable;
}

/**
 * Remove background using Python's rembg library (CPU-only, no VRAM used).
 *
 * Requires: pip install rembg[cpu]
 *
 * Falls back to the original image if rembg is not installed.
 */
async function removeBackground(inputPath: string, outputPath: string): Promise<string> {
  // Fast path: skip CLI call entirely if rembg isn't installed
  const available = await checkRembg();
  if (!available) {
    console.log('⏩ Skipping BG removal (rembg unavailable), using original image');
    fs.copyFileSync(inputPath, outputPath);
    return outputPath;
  }

  try {
    // Use rembg via CLI — runs on CPU, zero GPU VRAM
    const cmd = `python -m rembg i "${inputPath}" "${outputPath}"`;
    await execAsync(cmd, { timeout: 60_000 });
    console.log(`✂️  Background removed: ${path.basename(outputPath)}`);
    return outputPath;
  } catch (error: any) {
    console.warn(`⚠️ rembg failed (using original): ${error.message}`);
    // Copy original as fallback
    fs.copyFileSync(inputPath, outputPath);
    return outputPath;
  }
}

// ─── Image Resize ────────────────────────────────────────────────────

/**
 * Resize image to target dimensions using Python Pillow.
 * IPAdapter works best with 512×512 reference images.
 *
 * Uses LANCZOS resampling for quality.
 */
async function resizeImage(
  inputPath: string,
  outputPath: string,
  width: number = 512,
  height: number = 512
): Promise<string> {
  const pythonScript = `
from PIL import Image
img = Image.open("${inputPath.replace(/\\/g, '/')}")
img = img.convert("RGBA")
img = img.resize((${width}, ${height}), Image.LANCZOS)
img.save("${outputPath.replace(/\\/g, '/')}", "PNG")
print("Resized to ${width}x${height}")
`.trim();

  try {
    await execAsync(`python -c '${pythonScript}'`, { timeout: 15_000 });
    console.log(`📐 Resized: ${path.basename(outputPath)} → ${width}×${height}`);
    return outputPath;
  } catch (error: any) {
    console.warn(`⚠️ Resize failed (using original): ${error.message}`);
    // If resize fails, just copy the file
    if (inputPath !== outputPath) fs.copyFileSync(inputPath, outputPath);
    return outputPath;
  }
}

// ─── Main Processing Pipeline ────────────────────────────────────────

export interface ProcessResult {
  success: boolean;
  processedImagePath: string;      // ComfyUI-relative path (for workflow JSON)
  absolutePath: string;            // Full filesystem path
  error?: string;
}

/**
 * Full image processing pipeline:
 * 1. Download product image from URL
 * 2. Remove background (CPU-only via rembg)
 * 3. Resize to 512×512 (IPAdapter optimal)
 * 4. Save as PNG in ComfyUI/input/furniture/
 *
 * Returns the ComfyUI-relative filename for use in workflow JSON.
 */
export async function processProductImage(
  imageUrl: string,
  itemId: string
): Promise<ProcessResult> {
  try {
    const rawFilename = `raw-${itemId}.jpg`;
    const bgRemovedFilename = `nobg-${itemId}.png`;
    const finalFilename = `furniture-${itemId}.png`;

    // Step 1: Download
    const rawPath = await downloadImage(imageUrl, rawFilename);

    // Step 2: Remove background
    const bgRemovedPath = path.join(FURNITURE_DIR, bgRemovedFilename);
    await removeBackground(rawPath, bgRemovedPath);

    // Step 3: Resize to 512×512
    const finalPath = path.join(FURNITURE_DIR, finalFilename);
    await resizeImage(bgRemovedPath, finalPath, 512, 512);

    // Step 4: Clean up intermediate files
    try {
      if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath);
      if (fs.existsSync(bgRemovedPath) && bgRemovedPath !== finalPath) {
        fs.unlinkSync(bgRemovedPath);
      }
    } catch {
      // Non-fatal cleanup error
    }

    // ComfyUI-relative path (used in LoadImage node)
    const comfyRelativePath = `furniture/${finalFilename}`;

    console.log(`✅ Processed: ${comfyRelativePath}`);
    return {
      success: true,
      processedImagePath: comfyRelativePath,
      absolutePath: finalPath,
    };

  } catch (error: any) {
    console.error(`❌ Image processing failed: ${error.message}`);
    return {
      success: false,
      processedImagePath: '',
      absolutePath: '',
      error: error.message,
    };
  }
}
