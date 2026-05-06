/**
 * API Route: Lighting Tab
 * POST /api/ai/lighting — Low-denoise relighting
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

    const { mood = 'warm', timeOfDay = 'day', intensity = 0.35, roomType = 'living room' } = data;
    const comfyInputDir = process.env.COMFY_INPUT || '/home/nikhil/Documents/Remo2/ComfyUI/input';
    await mkdir(comfyInputDir, { recursive: true });

    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const comfyFilename = `lighting_${Date.now()}.png`;
    await sharp(buffer).resize(1024, 1024, { fit: 'inside', withoutEnlargement: true }).png().toFile(path.join(comfyInputDir, comfyFilename));

    let referenceLight: string | null = null;
    const refFile = formData.get('referenceLight') as File | null;
    if (refFile) {
      const refBuf = Buffer.from(await refFile.arrayBuffer());
      const refFn = `lighting_ref_${Date.now()}.png`;
      await sharp(refBuf).resize(1024, 1024, { fit: 'inside', withoutEnlargement: true }).png().toFile(path.join(comfyInputDir, refFn));
      referenceLight = refFn;
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(path.join(uploadsDir, comfyFilename), buffer);

    const project = await Project.create({
      name: `Lighting — ${mood} ${timeOfDay}`, userId: '000000000000000000000000',
      originalImage: `/uploads/${comfyFilename}`, status: 'queued', processingType: 'tab-lighting',
      aiConfig: { mood, timeOfDay, intensity, roomType },
    });

    comfyBridge.enqueueTabJob(project._id.toString(), 'lighting', {
      imageFilename: comfyFilename, mood, timeOfDay, intensity, referenceLight,
    }).catch((err: any) => console.error('❌ Lighting error:', err.message));

    return NextResponse.json({ success: true, projectId: project._id, tab: 'lighting', status: 'queued' });
  } catch (error: any) {
    return NextResponse.json({ error: 'Lighting failed', message: error.message }, { status: 500 });
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
