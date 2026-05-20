/**
 * API Route: Edit Tab (Regional Inpainting)
 * POST /api/ai/edit
 *
 * Accepts an image, a user-painted mask, and a prompt.
 * Uses VAEEncodeForInpaint for masked region editing.
 */

import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { Readable } from 'stream';
import { connectDB } from '@/src/lib/mongodb';
import Project from '@/src/models/Project';
import comfyBridge from '@/src/services/comfyBridge';
import { NextResponse } from 'next/server';
import sharp from 'sharp';

export const runtime = 'nodejs';

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
    const maskFile = formData.get('mask');
    const rawData = formData.get('data');
    const data = rawData ? JSON.parse(rawData) : {};

    if (!imageFile || !maskFile) {
      return NextResponse.json(
        { error: 'Both image and mask are required' },
        { status: 400 }
      );
    }

    const {
      prompt = 'high quality interior detail, photorealistic',
      negativePrompt,
      denoise = 0.65,
      roomType = 'living room',
    } = data;

    const comfyInputDir = process.env.COMFY_INPUT || '/home/nikhil/Documents/Remo2/ComfyUI/input';
    await mkdir(comfyInputDir, { recursive: true });

    // Save image
    const imgBytes = await imageFile.arrayBuffer();
    const imgBuffer = Buffer.from(imgBytes);
    const imgFilename = `edit_${Date.now()}.png`;
    await sharp(imgBuffer)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .png()
      .toFile(path.join(comfyInputDir, imgFilename));

    // Save mask
    const maskBytes = await maskFile.arrayBuffer();
    const maskBuffer = Buffer.from(maskBytes);
    const maskFilename = `edit_mask_${Date.now()}.png`;
    await sharp(maskBuffer)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .png()
      .toFile(path.join(comfyInputDir, maskFilename));

    // Save upload preview
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(path.join(uploadsDir, imgFilename), imgBuffer);

    const project = await Project.create({
      name: `Edit — ${roomType}`,
      userId: '000000000000000000000000',
      originalImage: `/uploads/${imgFilename}`,
      status: 'queued',
      processingType: 'tab-edit',
      aiConfig: { roomType, prompt, denoise },
    });

    // enqueueSmartTabJob pre-runs Stage 1 to provide depth map,
    // giving the edit workflow ControlNet guidance for perspective preservation
    comfyBridge.enqueueSmartTabJob(project._id.toString(), 'edit', {
      imageFilename: imgFilename,
      maskFilename,
      roomType,
      prompt,
      negativePrompt,
      denoise,
    }).catch((err: any) => console.error('❌ Edit tab error:', err.message));

    return NextResponse.json({
      success: true,
      projectId: project._id,
      tab: 'edit',
      status: 'queued',
    });
  } catch (error: any) {
    console.error('❌ Edit API error:', error);
    return NextResponse.json(
      { error: 'Edit failed', message: error.message },
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
