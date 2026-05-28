/**
 * Tool 12: Style Transfer — IPAdapter high-weight style application
 */
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { connectDB } from '@/lib/db/mongodb';
import Project from '@/src/models/Project';
import comfyBridge from '@/src/services/comfyBridge';
import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { checkIPAdapterModels, IPADAPTER_MISSING_ERROR } from '@/lib/ai/preflight';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  await connectDB();
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const refFile = formData.get('referenceImage') as File;
    const data = JSON.parse((formData.get('data') as string) || '{}');
    if (!imageFile || !refFile) return NextResponse.json({ error: 'Both room image and style reference required' }, { status: 400 });

    // IPAdapter pre-flight: required for style transfer
    const ipOk = await checkIPAdapterModels();
    if (!ipOk) return NextResponse.json(IPADAPTER_MISSING_ERROR, { status: 422 });
    const { styleWeight = 0.75, structureStrength = 0.90, denoise = 0.45, prompt = '' } = data;
    const comfyInputDir = process.env.COMFY_INPUT || '/home/nikhil/Documents/Remo2/ComfyUI/input';
    await mkdir(comfyInputDir, { recursive: true });
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const fn = `style_transfer_${Date.now()}.png`;
    await sharp(buffer).resize(1024, 1024, { fit: 'inside', withoutEnlargement: true }).png().toFile(path.join(comfyInputDir, fn));
    const refBuffer = Buffer.from(await refFile.arrayBuffer());
    const refFn = `style_ref_${Date.now()}.png`;
    await sharp(refBuffer).resize(1024, 1024, { fit: 'inside', withoutEnlargement: true }).png().toFile(path.join(comfyInputDir, refFn));
    await mkdir(path.join(process.cwd(), 'public', 'uploads'), { recursive: true });
    await writeFile(path.join(process.cwd(), 'public', 'uploads', fn), buffer);
    const project = await Project.create({ name: 'Style Transfer', userId: '000000000000000000000000', originalImage: `/uploads/${fn}`, status: 'queued', processingType: 'tool-style-transfer', aiConfig: { styleWeight, structureStrength, denoise } });
    comfyBridge.enqueueTabJob(project._id.toString(), 'style-transfer', { imageFilename: fn, referenceImage: refFn, styleWeight, structureStrength, denoise, prompt }).catch((e: any) => console.error('❌ Style transfer error:', e.message));
    return NextResponse.json({ success: true, projectId: project._id, tab: 'style-transfer', status: 'queued' });
  } catch (error: any) { return NextResponse.json({ error: 'Style transfer failed', message: error.message }, { status: 500 }); }
}
export async function GET(request: Request) { await connectDB(); const projectId = new URL(request.url).searchParams.get('projectId'); if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 }); const project = await Project.findById(projectId); return project ? NextResponse.json(project) : NextResponse.json({ error: 'Not found' }, { status: 404 }); }
