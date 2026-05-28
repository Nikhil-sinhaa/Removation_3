/**
 * Tool 5: Creative Landscape
 */
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { connectDB } from '@/lib/db/mongodb';
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
    const { landscapeType = 'garden', style = 'modern', prompt = '', strength = 0.80 } = data;
    const comfyInputDir = process.env.COMFY_INPUT || '/home/nikhil/Documents/Remo2/ComfyUI/input';
    await mkdir(comfyInputDir, { recursive: true });
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const fn = `landscape_${Date.now()}.png`;
    await sharp(buffer).resize(1024, 1024, { fit: 'inside', withoutEnlargement: true }).png().toFile(path.join(comfyInputDir, fn));
    await mkdir(path.join(process.cwd(), 'public', 'uploads'), { recursive: true });
    await writeFile(path.join(process.cwd(), 'public', 'uploads', fn), buffer);
    let referenceImage: string | null = null;
    const refFile = formData.get('referenceImage') as File | null;
    if (refFile) { const rb = Buffer.from(await refFile.arrayBuffer()); const rf = `landscape_ref_${Date.now()}.png`; await sharp(rb).resize(1024, 1024, { fit: 'inside', withoutEnlargement: true }).png().toFile(path.join(comfyInputDir, rf)); referenceImage = rf; }
    const project = await Project.create({ name: `Landscape — ${landscapeType}`, userId: '000000000000000000000000', originalImage: `/uploads/${fn}`, status: 'queued', processingType: 'tool-landscape', aiConfig: { landscapeType, style, prompt, strength } });
    comfyBridge.enqueueTabJob(project._id.toString(), 'landscape', { imageFilename: fn, landscapeType, style, prompt, strength, referenceImage }).catch((e: any) => console.error('❌ Landscape error:', e.message));
    return NextResponse.json({ success: true, projectId: project._id, tab: 'landscape', status: 'queued' });
  } catch (error: any) { return NextResponse.json({ error: 'Landscape failed', message: error.message }, { status: 500 }); }
}
export async function GET(request: Request) { await connectDB(); const projectId = new URL(request.url).searchParams.get('projectId'); if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 }); const project = await Project.findById(projectId); return project ? NextResponse.json(project) : NextResponse.json({ error: 'Not found' }, { status: 404 }); }
