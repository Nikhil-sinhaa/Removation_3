/**
 * POST /api/multi-room/create
 *
 * Accepts 3-15 room photos + a wall color, creates a MultiRoomProject,
 * then fire-and-forget starts painting all photos via Room Changer.
 *
 * Returns { success: true, projectId, totalPhotos } immediately.
 * The frontend polls /api/multi-room/status/[projectId] for progress.
 */

import { Readable } from 'stream';
import { NextResponse } from 'next/server';
import { connectDB } from '../../../../src/lib/mongodb.js';
import MultiRoomProject from '../../../../src/models/MultiRoomProject.js';
import { saveImageForComfy, saveUploadPreview } from '@/lib/ai/save-image-for-comfy';
import { paintAllPhotos } from '../../../../src/services/multiRoomOrchestrator.js';

export const runtime = 'nodejs';

// ── Turbopack-safe multipart parser (same pattern as room-changer) ────────────
async function safeParseFormData(request) {
  try {
    return await request.formData();
  } catch (_) {
    const Busboy = (await import('busboy')).default;
    const contentType = request.headers.get('content-type') || '';
    return new Promise(async (resolve, reject) => {
      const fields = new Map();
      const files = [];
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
          files.push({ fieldname, blob });
        });
      });
      bb.on('field', (fieldname, value) => fields.set(fieldname, value));
      bb.on('close', () =>
        resolve({
          get: k => fields.get(k) ?? null,
          getAll: k => files.filter(f => f.fieldname === k).map(f => f.blob),
        })
      );
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

    const colorName = (formData.get('colorName') || '').trim();
    const colorHex  = (formData.get('colorHex')  || '').trim();
    const roomName  = (formData.get('roomName')   || 'My Room').trim();
    const photos    = formData.getAll('photos');

    // ── Validation ──────────────────────────────────────────────────────────
    if (photos.length < 3) {
      return NextResponse.json(
        { error: 'Please upload at least 3 room photos' },
        { status: 400 }
      );
    }
    if (photos.length > 15) {
      return NextResponse.json(
        { error: 'Maximum 15 photos allowed per project' },
        { status: 400 }
      );
    }
    if (!colorName) {
      return NextResponse.json({ error: 'colorName is required' }, { status: 400 });
    }
    if (!/^#[0-9A-Fa-f]{6}$/.test(colorHex)) {
      return NextResponse.json(
        { error: 'Invalid colorHex — must be #RRGGBB' },
        { status: 400 }
      );
    }

    // ── Save all uploaded photos ─────────────────────────────────────────────
    const savedPhotos = [];

    for (let i = 0; i < photos.length; i++) {
      const file = photos[i];
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uploadFilename = `multiroom_${Date.now()}_${i}_${file.name || 'photo.jpg'}`;

      // Public preview URL
      const originalUrl = await saveUploadPreview(buffer, uploadFilename);

      // ComfyUI input file (PNG, SDXL-range resolution)
      let comfyFilename;
      try {
        const pngName = uploadFilename.replace(/\.[^.]+$/, '.png');
        comfyFilename = await saveImageForComfy(buffer, pngName);
      } catch {
        comfyFilename = await saveImageForComfy(buffer, uploadFilename);
      }

      savedPhotos.push({
        originalUrl,
        comfyFilename,
        order: i,
        status: 'queued',
      });
    }

    // ── Create MultiRoomProject ──────────────────────────────────────────────
    const mp = await MultiRoomProject.create({
      roomName,
      colorName,
      colorHex,
      photos: savedPhotos,
      totalCount: savedPhotos.length,
      paintingStatus: 'idle',
    });

    const mpId = String(mp._id);

    // ── Fire-and-forget painting pipeline ───────────────────────────────────
    paintAllPhotos(mpId).catch(err => {
      console.error(`[multi-room/create] paintAllPhotos error (project ${mpId}):`, err.message);
    });

    return NextResponse.json({
      success: true,
      projectId: mpId,
      totalPhotos: savedPhotos.length,
    });

  } catch (error) {
    console.error('❌ /api/multi-room/create POST error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
