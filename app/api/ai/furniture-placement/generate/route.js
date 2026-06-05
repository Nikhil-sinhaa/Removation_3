/**
 * POST /api/ai/furniture-placement/generate
 * GET  /api/ai/furniture-placement/generate?runId=...   (status polling fallback)
 *
 * Accepts roomImage + furnitureImage files + placement JSON.
 * Returns projectId/runId immediately; frontend listens on Socket.IO for progress.
 */

import { Readable } from 'stream';
import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/db/mongodb';
import Project from '../../../../../src/models/Project.js';
import FurniturePlacementRun from '../../../../../src/models/FurniturePlacementRun.js';
import { saveImageForComfy, saveUploadPreview } from '@/lib/ai/save-image-for-comfy';
import { runFurniturePlacement } from '../../../../../src/services/furniturePlacementOrchestrator.js';
import { getCurrentUser } from '@/lib/auth/jwt';
import { checkAndDeductCredits } from '@/lib/ai/deductCredits';
import { getQueueDepth } from '@/lib/redis/aiQueue';

export const runtime = 'nodejs';

// ── Turbopack-safe multipart parser (same pattern as room-changer) ─────────────
async function safeParseFormData(request) {
  try {
    return await request.formData();
  } catch (_) {
    const Busboy = (await import('busboy')).default;
    const contentType = request.headers.get('content-type') || '';
    return new Promise(async (resolve, reject) => {
      const fields = new Map();
      const files  = new Map();
      const bb     = Busboy({ headers: { 'content-type': contentType } });
      bb.on('file', (fieldname, fileStream, info) => {
        const { filename, mimeType } = info;
        const chunks = [];
        fileStream.on('data', c => chunks.push(c));
        fileStream.on('end', () => {
          const buffer = Buffer.concat(chunks);
          const blob   = new Blob([buffer], { type: mimeType });
          blob.name          = filename;
          blob.arrayBuffer   = async () =>
            buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
          files.set(fieldname, blob);
        });
      });
      bb.on('field', (fieldname, value) => fields.set(fieldname, value));
      bb.on('close', () => resolve({ get: k => files.get(k) || fields.get(k) || null }));
      bb.on('error', reject);
      const ab = await request.arrayBuffer();
      Readable.from(Buffer.from(ab)).pipe(bb);
    });
  }
}

async function saveFile(file, prefix) {
  const bytes  = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const uploadFilename = `${prefix}_${Date.now()}_${file.name || 'image.png'}`;

  const inputImageUrl = await saveUploadPreview(buffer, uploadFilename);
  const pngFilename   = uploadFilename.replace(/\.[^.]+$/, '.png');
  let comfyFilename;
  try {
    comfyFilename = await saveImageForComfy(buffer, pngFilename);
  } catch {
    comfyFilename = await saveImageForComfy(buffer, uploadFilename);
  }
  return { inputImageUrl, comfyFilename };
}

export async function POST(request) {
  await connectDB();

  try {
    const authUser = await getCurrentUser();
    if (!authUser || !authUser.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const finalUserId = authUser.id;

    const queueDepth = await getQueueDepth();
    if (queueDepth >= 10) {
      return NextResponse.json(
        { error: 'Server is busy. Please try again in a few minutes.' },
        { status: 503 }
      );
    }

    const deductResult = await checkAndDeductCredits(finalUserId, 'furniture-placement/generate');
    if (!deductResult.success) {
      return NextResponse.json({
        error: 'insufficient_credits',
        message: deductResult.reason,
        remainingCredits: deductResult.remaining,
        upgradeUrl: '/pricing'
      }, { status: 402 });
    }

    const formData       = await safeParseFormData(request);
    const roomFile       = formData.get('roomImage');
    const furnitureFile  = formData.get('furnitureImage');
    const placementRaw   = formData.get('placement');

    // ── Validation ───────────────────────────────────────────────────────────
    if (!roomFile)      return NextResponse.json({ error: 'roomImage is required' },      { status: 400 });
    if (!furnitureFile) return NextResponse.json({ error: 'furnitureImage is required' }, { status: 400 });
    if (!placementRaw)  return NextResponse.json({ error: 'placement JSON is required' }, { status: 400 });

    let placement;
    try {
      placement = JSON.parse(placementRaw);
    } catch {
      return NextResponse.json({ error: 'placement must be valid JSON' }, { status: 400 });
    }

    // ── Save both images ──────────────────────────────────────────────────────
    const {
      inputImageUrl: roomImageUrl,
      comfyFilename: roomComfyFilename,
    } = await saveFile(roomFile, 'furnplacement_room');

    const {
      inputImageUrl: furnitureImageUrl,
      comfyFilename: furnitureComfyFilename,
    } = await saveFile(furnitureFile, 'furnplacement_furniture');

    // ── Create Project + Run documents ────────────────────────────────────────
    const project = await Project.create({
      name:           'Furniture Placement',
      userId:         finalUserId,
      originalImage:  roomImageUrl,
      status:         'queued',
      processingType: 'furniture-placement',
    });
    const projectId = String(project._id);

    const run = await FurniturePlacementRun.create({
      userId:           finalUserId,
      projectId:        project._id,
      roomImageUrl,
      furnitureImageUrl,
      placement,
      status:           'processing',
    });
    const runId = String(run._id);

    // ── Fire-and-forget pipeline ──────────────────────────────────────────────
    runFurniturePlacement({
      userId:                 finalUserId,
      runId,
      projectId,
      roomComfyFilename,
      furnitureComfyFilename,
      roomImageUrl,
      furnitureImageUrl,
      placement,
    }).catch(err => console.error('[FurniturePlacement] Unhandled:', err.message));

    return NextResponse.json({ success: true, projectId, runId });

  } catch (error) {
    console.error('❌ /api/ai/furniture-placement/generate POST error:', error.message);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// ── Polling fallback: GET ?runId=... ──────────────────────────────────────────
export async function GET(request) {
  await connectDB();
  const authUser = await getCurrentUser();
  if (!authUser || !authUser.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const runId = searchParams.get('runId');
  if (!runId) return NextResponse.json({ error: 'runId required' }, { status: 400 });

  try {
    const run = await FurniturePlacementRun.findOne({ _id: runId, userId: authUser.id }).lean();
    if (!run) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({
      status:       run.status,
      beforeUrl:    run.roomImageUrl || null,
      afterUrl:     run.resultUrl    || null,
      errorMessage: run.errorMessage || null,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
