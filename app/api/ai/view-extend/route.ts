/**
 * Tool 14: View Extender / Outpainting
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
    const { direction = 'right', extendPercent = 30, prompt = '' } = data;
    const comfyInputDir = process.env.COMFY_INPUT || '/home/nikhil/Documents/Remo2/ComfyUI/input';
    await mkdir(comfyInputDir, { recursive: true });
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const fn = `view_extend_${Date.now()}.png`;
    await sharp(buffer).resize(1024, 1024, { fit: 'inside', withoutEnlargement: true }).png().toFile(path.join(comfyInputDir, fn));
    await mkdir(path.join(process.cwd(), 'public', 'uploads'), { recursive: true });
    await writeFile(path.join(process.cwd(), 'public', 'uploads', fn), buffer);
    const project = await Project.create({ name: `View Extend — ${direction}`, userId: '000000000000000000000000', originalImage: `/uploads/${fn}`, status: 'queued', processingType: 'tool-view-extend', aiConfig: { direction, extendPercent, prompt } });
    comfyBridge.enqueueTabJob(project._id.toString(), 'view-extend', { imageFilename: fn, direction, extendPercent, prompt }).catch((e: any) => console.error('❌ View extend error:', e.message));
    return NextResponse.json({ success: true, projectId: project._id, tab: 'view-extend', status: 'queued' });
  } catch (error: any) { return NextResponse.json({ error: 'View extend failed', message: error.message }, { status: 500 }); }
}
export async function GET(request: Request) { await connectDB(); const projectId = new URL(request.url).searchParams.get('projectId'); if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 }); const project = await Project.findById(projectId); return project ? NextResponse.json(project) : NextResponse.json({ error: 'Not found' }, { status: 404 }); }
