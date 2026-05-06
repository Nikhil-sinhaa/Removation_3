/**
 * Tool 9: Collage / Moodboard
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
    const data = JSON.parse((formData.get('data') as string) || '{}');
    if (!imageFile) return NextResponse.json({ error: 'No image' }, { status: 400 });
    const { prompt = '', strength = 0.65 } = data;
    const comfyInputDir = process.env.COMFY_INPUT || '/home/nikhil/Documents/Remo2/ComfyUI/input';
    await mkdir(comfyInputDir, { recursive: true });
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const fn = `collage_${Date.now()}.png`;
    await sharp(buffer).resize(1024, 1024, { fit: 'inside', withoutEnlargement: true }).png().toFile(path.join(comfyInputDir, fn));
    await mkdir(path.join(process.cwd(), 'public', 'uploads'), { recursive: true });
    await writeFile(path.join(process.cwd(), 'public', 'uploads', fn), buffer);
    const referenceImages: string[] = [];
    for (let i = 0; i < 4; i++) {
      const ref = formData.get(`reference${i}`) as File | null;
      if (ref) { const rb = Buffer.from(await ref.arrayBuffer()); const rf = `collage_ref${i}_${Date.now()}.png`; await sharp(rb).resize(1024, 1024, { fit: 'inside', withoutEnlargement: true }).png().toFile(path.join(comfyInputDir, rf)); referenceImages.push(rf); }
    }
    const project = await Project.create({ name: 'Collage', userId: '000000000000000000000000', originalImage: `/uploads/${fn}`, status: 'queued', processingType: 'tool-collage', aiConfig: { prompt, strength } });
    comfyBridge.enqueueTabJob(project._id.toString(), 'collage', { imageFilename: fn, referenceImages, prompt, strength }).catch((e: any) => console.error('❌ Collage error:', e.message));
    return NextResponse.json({ success: true, projectId: project._id, tab: 'collage', status: 'queued' });
  } catch (error: any) { return NextResponse.json({ error: 'Collage failed', message: error.message }, { status: 500 }); }
}
export async function GET(request: Request) { await connectDB(); const projectId = new URL(request.url).searchParams.get('projectId'); if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 }); const project = await Project.findById(projectId); return project ? NextResponse.json(project) : NextResponse.json({ error: 'Not found' }, { status: 404 }); }
