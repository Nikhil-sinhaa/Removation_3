/**
 * lib/ai/createVastuJob.ts
 *
 * Shared helper — creates a GpuJob for Vastu analysis via the Drive-based
 * async pipeline.  Used by:
 *   • /api/vastu         (drive mode, toggled via VASTU_PROCESSING_MODE)
 *   • /api/ai/jobs/vastu (dedicated Phase-B async entry-point)
 *
 * Responsibility:
 *   1. Resolve the imageUrl / imageFilename to a Buffer.
 *   2. Upload that Buffer to the Drive "Removation_Handoff_Queue" folder.
 *   3. Create a GpuJob document (status: 'pending').
 *   4. Return the new job ID (string).
 *
 * The worker daemon (scripts/comfy-worker.mjs) polls /api/ai/jobs/poll,
 * runs ComfyUI, uploads mask outputs, then calls /api/ai/jobs/[id]/complete.
 * Clients poll GET /api/ai/jobs/[id]/status.
 */

import path from 'path';
import { readFile } from 'fs/promises';
import { getAuthedClient, ensureQueueFolder, uploadBuffer, getDriveService } from '@/src/lib/googleDrive';
import GpuJob from '@/lib/db/models/GpuJob';

export interface CreateVastuJobParams {
  /** A public URL (/renders/…, /uploads/…, or https://…) */
  imageUrl?: string;
  /**
   * A ComfyUI input filename (already on disk).
   * If provided, imageUrl is ignored — we read the file directly.
   */
  imageFilename?: string;
  roomType: string;
  direction?: string;
  language?: string;
  userId: string;
}

export interface CreateVastuJobResult {
  jobId: string;
  driveFileId: string;
  fileName: string;
}

/** Resolve any supported image source to a Buffer. */
async function resolveImageBuffer(
  imageUrl?: string,
  imageFilename?: string,
): Promise<Buffer> {
  // ComfyUI input filename → read from disk
  if (imageFilename) {
    const comfyInputDir =
      process.env.COMFYUI_INPUT_DIR ??
      path.join(process.cwd(), 'ComfyUI', 'input');
    return readFile(path.join(comfyInputDir, imageFilename));
  }

  if (!imageUrl) {
    throw new Error('Either imageUrl or imageFilename is required');
  }

  if (imageUrl.startsWith('/renders/') || imageUrl.startsWith('/uploads/')) {
    const relativePath = imageUrl.replace(/^\//, '');
    const filePath = path.join(process.cwd(), 'public', relativePath);
    return readFile(filePath);
  }

  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error(`Failed to fetch image: HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }

  throw new Error(`Unsupported imageUrl format: ${imageUrl}`);
}

/**
 * Upload image to Drive and create a pending GpuJob.
 * Throws if Drive is not connected.
 */
export async function createVastuJob(
  params: CreateVastuJobParams,
): Promise<CreateVastuJobResult> {
  const { imageUrl, imageFilename, roomType, direction, language = 'en', userId } = params;

  // ── Resolve image → Buffer ─────────────────────────────────────────────────
  const imageBuffer = await resolveImageBuffer(imageUrl, imageFilename);

  // ── Upload to Drive queue folder ───────────────────────────────────────────
  const driveClient = await getAuthedClient();
  if (!driveClient) {
    throw new Error(
      'Google Drive not connected. Connect via /settings/gpu.',
    );
  }

  const drive = getDriveService(driveClient);
  const queueFolderId = await ensureQueueFolder(drive);

  const sourceSlug = imageFilename
    ? imageFilename.replace(/[^a-zA-Z0-9._-]/g, '_')
    : path.basename(imageUrl ?? 'image').replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileName = `vastu_input_${Date.now()}_${sourceSlug}`;

  const driveFileId = await uploadBuffer(drive, imageBuffer, fileName, queueFolderId);

  // ── Create GpuJob ──────────────────────────────────────────────────────────
  const job = await GpuJob.create({
    workflowType: 'vastu-analysis',
    status: 'pending',
    userId,
    inputs: {
      originalImage: { driveFileId, fileName },
    },
    params: { roomType, direction, language },
    queuedAt: new Date(),
  });

  const jobId = (job._id as { toString(): string }).toString();
  console.log(`[createVastuJob] Created job ${jobId} for user ${userId}`);

  return { jobId, driveFileId, fileName };
}
