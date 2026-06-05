/**
 * POST /api/ai/ceiling-changer/generate
 * GET  /api/ai/ceiling-changer/generate?projectId=...   (status polling fallback)
 *
 * Starts the Ceiling Changer pipeline asynchronously and returns immediately.
 * Frontend listens on Socket.IO (comfy:ceiling-changer:* events) for progress.
 */

import { Readable } from 'stream';
import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/db/mongodb';
import Project from '../../../../../src/models/Project.js';
import CeilingChangerRun from '../../../../../src/models/CeilingChangerRun.js';
import { saveImageForComfy, saveUploadPreview } from '@/lib/ai/save-image-for-comfy';
import { runCeilingChanger } from '../../../../../src/services/ceilingChangerOrchestrator.js';
import { getCurrentUser } from '@/lib/auth/jwt';
import { checkAndDeductCredits } from '@/lib/ai/deductCredits';
import { getQueueDepth } from '@/lib/redis/aiQueue';

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
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const queueDepth = await getQueueDepth();
    if (queueDepth >= 10) {
      return NextResponse.json(
        { error: 'Server is busy. Please try again in a few minutes.' },
        { status: 503 }
      );
    }

    const deductResult = await checkAndDeductCredits(authUser.id, 'ceiling-changer');
    if (!deductResult.success) {
      return NextResponse.json({
        error: 'insufficient_credits',
        message: deductResult.reason,
        remainingCredits: deductResult.remaining,
        upgradeUrl: '/pricing'
      }, { status: 402 });
    }

    const formData = await safeParseFormData(request);
    const imageFile = formData.get('roomImage');
    const colorName = formData.get('colorName') || '';
    const hex       = formData.get('hex') || '';
    const projectId = formData.get('projectId') || null;

    // ── Validation ────────────────────────────────────────────────────────────
    if (!imageFile) {
      return NextResponse.json({ error: 'No room image provided' }, { status: 400 });
    }
    if (!colorName.trim()) {
      return NextResponse.json({ error: 'colorName is required' }, { status: 400 });
    }
    if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      return NextResponse.json({ error: 'Invalid hex color (must be #RRGGBB)' }, { status: 400 });
    }

    // Save image for ComfyUI and as preview
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadFilename = `ceilingchanger_${Date.now()}_${imageFile.name || 'room.png'}`;

    const inputImageUrl = await saveUploadPreview(buffer, uploadFilename);
    const pngFilename = uploadFilename.replace(/\.[^.]+$/, '.png');
    let comfyFilename;
    try {
      comfyFilename = await saveImageForComfy(buffer, pngFilename);
    } catch {
      comfyFilename = await saveImageForComfy(buffer, uploadFilename);
    }

    // ── Create Project document for status polling ──────────────────────────
    const project = await Project.create({
      name: `Ceiling Changer — ${colorName}`,
      userId: authUser.id,
      originalImage: inputImageUrl || '',
      status: 'queued',
      processingType: 'ceiling-changer',
      aiConfig: { colorName, hex },
    });

    const projId = String(project._id);

    // ── Fire-and-forget pipeline ────────────────────────────────────────────
    runCeilingChanger({
      comfyFilename,
      inputImageUrl,
      colorName,
      hex,
      projectId: projId,
      userId: authUser.id,
    }).catch(err => {
      // CEILING_MASK_INSUFFICIENT_COVERAGE is a user-recoverable input error, not a
      // system fault. The orchestrator already wrote the clean message to
      // Project.errorMessage and emitted comfy:ceiling-changer:error via Socket.IO —
      // no further action needed here other than a less alarming log level.
      if (err.code === 'CEILING_MASK_INSUFFICIENT_COVERAGE') {
        console.warn(`⚠️  Ceiling Changer: ceiling detection failed (project ${projId}): ${err.message}`);
      } else {
        console.error('Ceiling Changer background error:', err.message);
      }
    });

    return NextResponse.json({ success: true, projectId: projId });

  } catch (error) {
    console.error('❌ /api/ai/ceiling-changer/generate POST error:', error.message);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// ── Polling fallback: GET ?projectId=... ─────────────────────────────────────
export async function GET(request) {
  await connectDB();
  const authUser = await getCurrentUser();
  if (!authUser || !authUser.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  if (!projectId) {
    return NextResponse.json({ error: 'projectId required' }, { status: 400 });
  }
  try {
    const project = await Project.findOne({ _id: projectId, userId: authUser.id }).lean();
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Also fetch the latest run for this project
    const run = await CeilingChangerRun.findOne({ projectId }).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      status: project.status,
      resultImage: project.resultImage,
      errorMessage: project.errorMessage,
      runId: run ? String(run._id) : null,
      beforeUrl: run?.inputImageUrl || null,
      afterUrl: run?.outputImageUrl || null,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
