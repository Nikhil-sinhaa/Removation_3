/**
 * POST /api/ai/furniture-remover/generate
 * GET  /api/ai/furniture-remover/generate?projectId=...   (status polling fallback)
 *
 * Starts the single-stage Furniture Remover pipeline asynchronously and returns immediately.
 * Frontend listens on Socket.IO (comfy:furniture-remover:* events) for progress.
 */

import { Readable } from 'stream';
import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../src/lib/mongodb.js';
import Project from '../../../../../src/models/Project.js';
import FurnitureRemoverRun from '../../../../../src/models/FurnitureRemoverRun.js';
import { saveImageForComfy, saveUploadPreview } from '@/lib/ai/save-image-for-comfy';
import { runFurnitureRemover, runManualFurnitureErase } from '../../../../../src/services/furnitureRemoverOrchestrator.js';

export const runtime = 'nodejs';

// Helper to save uploaded file preview and upload it to ComfyUI input directory
async function saveUploadAndComfy(file, isMask = false) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const prefix = isMask ? 'furnituremask' : 'furnitureremover';
  const uploadFilename = `${prefix}_${Date.now()}_${file.name || (isMask ? 'mask.png' : 'room.png')}`;

  const inputImageUrl = await saveUploadPreview(buffer, uploadFilename);
  const pngFilename = uploadFilename.replace(/\.[^.]+$/, '.png');
  let comfyFilename;
  try {
    comfyFilename = await saveImageForComfy(buffer, pngFilename);
  } catch {
    comfyFilename = await saveImageForComfy(buffer, uploadFilename);
  }
  return { inputImageUrl, comfyFilename };
}

// ── Turbopack-safe multipart parser (shared pattern) ──
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
    const roomImageFile = formData.get('roomImage');
    const userMaskFile  = formData.get('userMask') || formData.get('maskImage');   // present if manual brush mode

    // ── Validation ────────────────────────────────────────────────────────────
    if (!roomImageFile) {
      return NextResponse.json({ error: 'No room image provided' }, { status: 400 });
    }

    // Save room image
    const { inputImageUrl, comfyFilename } = await saveUploadAndComfy(roomImageFile, false);

    // ── Create Project document for status polling ────────────────────────────
    const project = await Project.create({
      name: 'Furniture Remover',
      userId: '000000000000000000000000',
      originalImage: inputImageUrl || '',
      status: 'queued',
      processingType: 'furniture-remover',
    });

    const projId = String(project._id);

    // ── Branching into Manual vs Auto Mode ─────────────────────────────────────
    if (userMaskFile) {
      // MANUAL MODE — user painted a mask
      console.log(`🎨 Manual mode starting for project ${projId}`);
      const { comfyFilename: comfyMaskFilename } = await saveUploadAndComfy(userMaskFile, true);

      runManualFurnitureErase({
        comfyFilename,
        comfyMaskFilename,
        projectId: projId,
      }).catch(err => console.error('Manual erase error:', err.message));

    } else {
      // AUTO MODE — full CLIPSeg + MiniMax + LaMa pipeline
      console.log(`🤖 Auto mode starting for project ${projId}`);

      runFurnitureRemover({
        comfyFilename,
        inputImageUrl,
        projectId: projId,
      }).catch(err => console.error('Auto remove error:', err.message));
    }

    return NextResponse.json({ success: true, projectId: projId });

  } catch (error) {
    console.error('❌ /api/ai/furniture-remover/generate POST error:', error.message);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// ── Polling fallback: GET ?projectId=... ──────────────────────────────────────
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

    const run = await FurnitureRemoverRun.findOne({ projectId }).sort({ createdAt: -1 }).lean();

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
