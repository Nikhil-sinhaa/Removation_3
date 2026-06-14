/**
 * StorageService — abstraction over local disk vs Google Drive.
 *
 * Controlled by STORAGE_MODE (DB → env var fallback):
 *   'local'  → write to public/renders/ (dev / local machine)
 *   'drive'  → upload to Google Drive (Vercel / production)
 *
 * Returns a full public URL in both cases.
 */

import path from 'path';
import fs from 'fs/promises';
import { uploadImageAndGetPublicUrl } from '@/src/lib/googleDrive';

export type StorageMode = 'local' | 'drive';

// ─── Mode resolution with 60-second DB cache ─────────────────────────────────

let _cachedMode: StorageMode | null = null;
let _cacheExpiry = 0;

/**
 * Resolve the active storage mode.
 * Reads from AppSettings DB first (60s cache), falls back to STORAGE_MODE env var.
 */
async function getStorageMode(): Promise<StorageMode> {
  // Serve from cache if still valid
  if (_cachedMode && Date.now() < _cacheExpiry) {
    return _cachedMode;
  }

  try {
    const { getSetting } = await import('@/src/lib/appSettings');
    const stored = await getSetting('STORAGE_MODE');
    if (stored === 'drive' || stored === 'local') {
      _cachedMode = stored;
      _cacheExpiry = Date.now() + 60_000; // cache for 60 seconds
      return _cachedMode;
    }
  } catch {
    // DB unavailable — fall through to env var
  }

  const envMode = process.env.STORAGE_MODE;
  return envMode === 'drive' ? 'drive' : 'local';
}

/** Invalidate the in-process cache (call after admin writes new mode). */
export function invalidateStorageModeCache(): void {
  _cachedMode = null;
  _cacheExpiry = 0;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Save a generated image buffer and return a full public URL.
 *
 * @param buffer - Raw image bytes
 * @param filename - e.g. 'render_abc123.png'
 * @returns Full URL: either '/renders/filename.png' (local) or 'https://drive.google.com/uc?...' (drive)
 */
export async function saveGeneratedImage(
  buffer: Buffer,
  filename: string,
  mimeType: string = 'image/png',
): Promise<string> {
  const mode = await getStorageMode();

  if (mode === 'drive') {
    const folderId = process.env.GOOGLE_DRIVE_RENDERS_FOLDER_ID;
    return await uploadImageAndGetPublicUrl(buffer, filename, mimeType, folderId);
  }

  // Local mode — write to public/renders/
  const rendersDir = path.join(process.cwd(), 'public', 'renders');
  await fs.mkdir(rendersDir, { recursive: true });
  await fs.writeFile(path.join(rendersDir, filename), buffer);
  return `/renders/${filename}`;
}

/**
 * Save an uploaded input image (for ComfyUI input directory).
 * Always local — ComfyUI reads from disk directly.
 * Returns the absolute path.
 */
export async function saveInputImage(
  buffer: Buffer,
  filename: string,
): Promise<string> {
  const comfyInputDir = process.env.COMFY_INPUT ||
    path.join(process.cwd(), '..', 'ComfyUI', 'input');
  await fs.mkdir(comfyInputDir, { recursive: true });
  const fullPath = path.join(comfyInputDir, filename);
  await fs.writeFile(fullPath, buffer);
  return fullPath;
}

/**
 * Save a preview/thumbnail image.
 * Uses STORAGE_MODE like generated images.
 */
export async function savePreviewImage(
  buffer: Buffer,
  filename: string,
): Promise<string> {
  const mode = await getStorageMode();

  if (mode === 'drive') {
    const folderId = process.env.GOOGLE_DRIVE_PREVIEWS_FOLDER_ID ||
      process.env.GOOGLE_DRIVE_RENDERS_FOLDER_ID;
    return await uploadImageAndGetPublicUrl(buffer, filename, 'image/jpeg', folderId);
  }

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.writeFile(path.join(uploadsDir, filename), buffer);
  return `/uploads/${filename}`;
}
