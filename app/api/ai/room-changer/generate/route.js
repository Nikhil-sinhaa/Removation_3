/**
 * POST /api/ai/room-changer/generate
 * GET  /api/ai/room-changer/generate?projectId=...   (status polling fallback)
 *
 * Starts the Room Changer pipeline asynchronously and returns immediately.
 * Frontend listens on Socket.IO (comfy:roomchanger:* events) for progress.
 */

import { Readable } from 'stream';
import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../src/lib/mongodb.js';
import Project from '../../../../../src/models/Project.js';
import RoomChangerRun from '../../../../../src/models/RoomChangerRun.js';
import { saveImageForComfy, saveUploadPreview } from '@/lib/ai/save-image-for-comfy';
import { runRoomChanger } from '../../../../../src/services/roomChangerOrchestrator.js';

export const runtime = 'nodejs';

// ── Turbopack-safe multipart parser (shared pattern from ultra-pro/route.js) ──
async function safeParseFormData(request) {
  try {
    return await request.formData();
  } catch (_) {
    const Busboy = (await import('busboy')).default;
    const contentType = request.headers.get('content-type') || '';
    return new Promise(async (resolve, reject) => {
      const fields = new Map();
      const files = new Map();
      const bb = Busboy({ headers: { 'content-type': contentType } });
      bb.on('file', (fieldname, fileStream, info) => {
        const { filename, mimeType } = info;
        const chunks = [];
        fileStream.on('data', c => chunks.push(c));
        fileStream.on('end', () => {
          const buffer = Buffer.concat(chunks);
          const blob = new Blob([buffer], { type: mimeType });
          blob.name = filename;
          blob.arrayBuffer = async () =>
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

export async function POST(request) {
  await connectDB();

  try {
    const formData = await safeParseFormData(request);
    const imageFile  = formData.get('roomImage');
    const colorName  = formData.get('colorName') || '';
    const hex        = formData.get('hex') || '';
    const projectId  = formData.get('projectId') || null;
    const retryRunId = formData.get('retryRunId') || null;

    // ── Validation ──────────────────────────────────────────────────────────
    if (!imageFile && !retryRunId) {
      return NextResponse.json({ error: 'No room image provided' }, { status: 400 });
    }
    if (!colorName.trim()) {
      return NextResponse.json({ error: 'colorName is required' }, { status: 400 });
    }
    if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      return NextResponse.json({ error: 'Invalid hex color (must be #RRGGBB)' }, { status: 400 });
    }

    let comfyFilename, inputImageUrl;

    if (retryRunId) {
      // Retry Stage 3 with existing masks — no new image upload needed
      const existingRun = await RoomChangerRun.findById(retryRunId);
      if (!existingRun) {
        return NextResponse.json({ error: 'Run not found' }, { status: 404 });
      }
      comfyFilename = null; // orchestrator will use saved stage1Outputs
      inputImageUrl = existingRun.inputImageUrl;
    } else {
      // Save image for ComfyUI and as preview
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uploadFilename = `roomchanger_${Date.now()}_${imageFile.name || 'room.png'}`;

      inputImageUrl = await saveUploadPreview(buffer, uploadFilename);
      const pngFilename = uploadFilename.replace(/\.[^.]+$/, '.png');
      try {
        comfyFilename = await saveImageForComfy(buffer, pngFilename);
      } catch {
        comfyFilename = await saveImageForComfy(buffer, uploadFilename);
      }
    }

    // ── Create Project document for status polling ────────────────────────
    const project = await Project.create({
      name: `Room Changer — ${colorName}`,
      userId: '000000000000000000000000',
      originalImage: inputImageUrl || '',
      status: 'queued',
      processingType: 'room-changer',
      aiConfig: { colorName, hex },
    });

    const projId = String(project._id);

    // ── Fire-and-forget pipeline ──────────────────────────────────────────
    runRoomChanger({
      comfyFilename,
      inputImageUrl,
      colorName,
      hex,
      projectId: projId,
      userId: null,
      runId: retryRunId || undefined,
      retryStage3: !!retryRunId,
    }).catch(err => {
      // WALL_MASK_INSUFFICIENT_COVERAGE is a user-recoverable input error, not a
      // system fault. The orchestrator already wrote the clean message to
      // Project.errorMessage and emitted comfy:roomchanger:error via Socket.IO —
      // no further action needed here other than a less alarming log level.
      if (err.code === 'WALL_MASK_INSUFFICIENT_COVERAGE') {
        console.warn(`⚠️  Room Changer: wall detection failed (project ${projId}): ${err.message}`);
      } else {
        console.error('Room Changer background error:', err.message);
      }
    });

    return NextResponse.json({ success: true, projectId: projId });

  } catch (error) {
    console.error('❌ /api/ai/room-changer/generate POST error:', error.message);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// ── Polling fallback: GET ?projectId=... ─────────────────────────────────────
export async function GET(request) {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 });
  }
  try {
    const project = await Project.findById(projectId).lean();
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Also fetch the latest run for this project
    const run = await RoomChangerRun.findOne({ projectId }).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      status: project.status,
      resultImage: project.resultImage,
      errorMessage: project.errorMessage,
      runId: run ? String(run._id) : null,
      beforeUrl: run?.inputImageUrl || null,
      afterUrl: run?.outputImageUrl || null,
      canRetryStage3: run?.stage1Completed ?? false,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
