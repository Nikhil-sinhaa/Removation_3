/**
 * API Route: Render Tab
 * POST /api/ai/render
 *
 * Triggers the Render workflow (ControlNet + KSampler redesign,
 * optional IPAdapter style reference).
 */

import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { Readable } from 'stream';
import { connectDB } from '@/lib/db/mongodb';
import Project from '@/src/models/Project';
import comfyBridge from '@/src/services/comfyBridge';
import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { checkIPAdapterModels, IPADAPTER_MISSING_ERROR } from '@/lib/ai/preflight';
import { saveImageForComfy, saveUploadPreview } from '@/lib/ai/save-image-for-comfy';

export const runtime = 'nodejs';

// Turbopack-safe FormData parser
async function safeParseFormData(request: Request) {
  try {
    return await request.formData();
  } catch (_) {
    const Busboy = (await import('busboy')).default;
    const contentType = request.headers.get('content-type') || '';
    return new Promise<any>(async (resolve, reject) => {
      const fields = new Map();
      const files = new Map();
      const bb = Busboy({ headers: { 'content-type': contentType } });
      bb.on('file', (fieldname: string, fileStream: any, info: any) => {
        const { filename, mimeType } = info;
        const chunks: Buffer[] = [];
        fileStream.on('data', (c: Buffer) => chunks.push(c));
        fileStream.on('end', () => {
          const buffer = Buffer.concat(chunks);
          const blob: any = new Blob([buffer], { type: mimeType });
          blob.name = filename;
          blob.arrayBuffer = async () =>
            buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
          files.set(fieldname, blob);
        });
      });
      bb.on('field', (fieldname: string, value: string) => fields.set(fieldname, value));
      bb.on('close', () =>
        resolve({ get: (k: string) => files.get(k) || fields.get(k) || null })
      );
      bb.on('error', reject);
      const ab = await request.arrayBuffer();
      Readable.from(Buffer.from(ab)).pipe(bb);
    });
  }
}

export async function POST(request: Request) {
  await connectDB();

  try {
    const formData = await safeParseFormData(request);
    const imageFile = formData.get('image');
    const rawData = formData.get('data');
    const data = rawData ? JSON.parse(rawData) : {};

    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const {
      roomType = 'living room',
      style = 'modern minimalist',
      prompt = '',
      strength = 0.75,
      cannyStrength = 0.85,
    } = data;

    // Save image to ComfyUI/input (local or remote cloud)
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const comfyFilename = `render_${Date.now()}.png`;

    const comfyInputFilename = await saveImageForComfy(buffer, comfyFilename);

    // Save optional reference image
    let referenceImage: string | null = null;
    const refFile = formData.get('referenceImage');
    if (refFile && typeof refFile !== 'string') {
      const refBytes = await refFile.arrayBuffer();
      const refBuffer = Buffer.from(refBytes);
      const refFilename = `render_ref_${Date.now()}.png`;
      referenceImage = await saveImageForComfy(refBuffer, refFilename);

      // IPAdapter pre-flight: validate models before enqueueing
      const ipOk = await checkIPAdapterModels();
      if (!ipOk) {
        return NextResponse.json(IPADAPTER_MISSING_ERROR, { status: 422 });
      }
    }

    // Save upload copy for preview (always local, served by Next.js)
    const previewUrl = await saveUploadPreview(buffer, comfyFilename);

    // Create project
    const project = await Project.create({
      name: `Render — ${roomType}`,
      userId: '000000000000000000000000',
      originalImage: previewUrl,
      status: 'queued',
      processingType: 'tab-render',
      aiConfig: { style, roomType, prompt, strength },
    });

    // Fire-and-forget — enqueueSmartTabJob runs Stage 1 scene analysis
    // before the render workflow, providing depth map for dual-ControlNet
    comfyBridge.enqueueSmartTabJob(project._id.toString(), 'render', {
      imageFilename: comfyInputFilename,
      roomType,
      style,
      prompt,
      strength,
      cannyStrength,
      referenceImage,
    }).catch((err: any) => console.error('❌ Render tab error:', err.message));

    return NextResponse.json({
      success: true,
      projectId: project._id,
      tab: 'render',
      status: 'queued',
    });
  } catch (error: any) {
    console.error('❌ Render API error:', error);
    return NextResponse.json(
      { error: 'Render failed', message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });
  const project = await Project.findById(projectId);
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(project);
}
