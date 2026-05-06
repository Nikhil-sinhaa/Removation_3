/**
 * Pre-flight checks for ComfyUI model availability.
 * Shared utility used by API routes before enqueueing jobs.
 */
import { access } from 'fs/promises';

const COMFY_BASE = process.env.COMFY_BASE || '/home/nikhil/Documents/Remo2/ComfyUI';
const COMFY_URL = process.env.COMFY_URL || 'http://127.0.0.1:8188';

/**
 * Verify that IPAdapter + CLIP Vision models are installed.
 * Returns true if both files exist on disk.
 */
export async function checkIPAdapterModels(): Promise<boolean> {
  try {
    await access(`${COMFY_BASE}/models/ipadapter/ip-adapter-plus_sdxl_vit-h.safetensors`);
    await access(`${COMFY_BASE}/models/clip_vision/CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a custom ComfyUI node class is available via the /object_info endpoint.
 * @param className - e.g. 'LamaRemover', 'ICLight', etc.
 */
export async function checkNodeAvailable(className: string): Promise<boolean> {
  try {
    const res = await fetch(`${COMFY_URL}/object_info/${className}`, {
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * IPAdapter pre-flight error response body.
 */
export const IPADAPTER_MISSING_ERROR = {
  error: 'IPAdapter models not installed',
  details: 'Required: ip-adapter-plus_sdxl_vit-h.safetensors + CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors',
  fix: 'Download from https://huggingface.co/h94/IP-Adapter and place in ComfyUI/models/ipadapter/ and ComfyUI/models/clip_vision/',
};
