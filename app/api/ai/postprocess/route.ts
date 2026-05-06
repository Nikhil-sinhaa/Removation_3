/**
 * API Route: Post-Process Tab
 * POST /api/ai/postprocess — 4× Upscale + Sharpen + Color Grade
 */
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { connectDB } from '@/src/lib/mongodb';
import Project from '@/src/models/Project';
import comfyBridge from '@/src/services/comfyBridge';
import { NextResponse } from 'next/server';
import sharp from 'sharp';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  await connectDB();
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const rawData = formData.get('data') as string;
    const data = rawData ? JSON.parse(rawData) : {};
    if (!imageFile) return NextResponse.json({ error: 'No image' }, { status: 400 });

    const { upscale4x = true, sharpen = true, colorGrade = 'none', targetScale = 0.5 } = data;
    const comfyInputDir = process.env.COMFY_INPUT || '/home/nikhil/Documents/Remo2/ComfyUI/input';
    await mkdir(comfyInputDir, { recursive: true });

    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const comfyFilename = `postprocess_${Date.now()}.png`;
    // Cap at 768px for 8GB VRAM safety: RealESRGAN 4× → 3072px, then 0.5× → 1536px final
    await sharp(buffer).resize(768, 768, { fit: 'inside', withoutEnlargement: true }).png().toFile(path.join(comfyInputDir, comfyFilename));

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(path.join(uploadsDir, comfyFilename), buffer);

    const project = await Project.create({
      name: `Post-Process — ${colorGrade}`, userId: '000000000000000000000000',
      originalImage: `/uploads/${comfyFilename}`, status: 'queued', processingType: 'tab-postprocess',
      aiConfig: { upscale4x, sharpen, colorGrade, targetScale },
    });

    comfyBridge.enqueueTabJob(project._id.toString(), 'postprocess', {
      imageFilename: comfyFilename, upscale4x, sharpen, colorGrade, targetScale,
    }).catch((err: any) => console.error('❌ Post-process error:', err.message));

    return NextResponse.json({ success: true, projectId: project._id, tab: 'postprocess', status: 'queued' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Post-process failed', message: error.message }, { status: 500 });
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
