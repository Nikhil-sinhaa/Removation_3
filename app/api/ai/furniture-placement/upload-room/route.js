/**
 * POST /api/ai/furniture-placement/upload-room
 *
 * Accepts a room image file, saves it to ComfyUI input,
 * and returns the comfyFilename for use in the composite step.
 */

import { Readable } from 'stream';
import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { saveImageForComfy, saveUploadPreview } from '@/lib/ai/save-image-for-comfy';

export const runtime = 'nodejs';

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

export async function POST(request) {
  try {
    const formData = await safeParseFormData(request);
    const roomFile = formData.get('roomImage');

    if (!roomFile) {
      return NextResponse.json({ error: 'roomImage required' }, { status: 400 });
    }

    const bytes  = await roomFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const prefix = `furnplace_room_${Date.now()}`;
    const uploadFilename = `${prefix}_${roomFile.name || 'room.png'}`;

    // Save preview for UI
    const inputImageUrl = await saveUploadPreview(buffer, uploadFilename);

    // Save to ComfyUI input
    const pngFilename = uploadFilename.replace(/\.[^.]+$/, '.png');
    let comfyFilename;
    try {
      comfyFilename = await saveImageForComfy(buffer, pngFilename);
    } catch {
      comfyFilename = await saveImageForComfy(buffer, uploadFilename);
    }

    // Compute the dimensions saveImageForComfy will have produced.
    // saveImageForComfy uses fit:'inside' with max 1024px, so AR is preserved.
    // The canvas must match this AR or the coordinate mapping will be wrong.
    const { width: origW = 1024, height: origH = 768 } = await sharp(buffer).metadata();
    const longestSide = Math.max(origW, origH);
    const TARGET = 1024;
    let roomWidth, roomHeight;
    if (longestSide <= TARGET) {
      roomWidth  = origW;
      roomHeight = origH;
    } else {
      if (origW >= origH) {
        roomWidth  = TARGET;
        roomHeight = Math.round(TARGET * origH / origW);
      } else {
        roomHeight = TARGET;
        roomWidth  = Math.round(TARGET * origW / origH);
      }
    }

    return NextResponse.json({ success: true, inputImageUrl, comfyFilename, roomWidth, roomHeight });

  } catch (err) {
    console.error('[FurniturePlacementV2] upload-room error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
