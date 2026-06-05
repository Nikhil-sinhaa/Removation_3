/**
 * Tool 3: Interior AI Render — Sketch/floor plan → photorealistic interior
 */
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { connectDB } from '@/lib/db/mongodb';
import Project from '@/src/models/Project';
import comfyBridge from '@/src/services/comfyBridge';
import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { getCurrentUser } from '@/lib/auth/jwt';
import { getQueueDepth } from '@/lib/redis/aiQueue';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  await connectDB();
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const finalUserId = authUser.id;

    const queueDepth = await getQueueDepth();
    if (queueDepth >= 10) {
      return NextResponse.json(
        { error: 'Server is busy. Please try again in a few minutes.' },
        { status: 503 }
      );
    }

    const { checkAndDeductCredits } = await import('@/lib/ai/deductCredits');
    const deductResult = await checkAndDeductCredits(authUser.id, 'interior-render');
    if (!deductResult.success) {
      return NextResponse.json({
        error: 'insufficient_credits',
        message: deductResult.reason,
        remainingCredits: deductResult.remaining,
        upgradeUrl: '/billing'
      }, { status: 402 });
    }

    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const rawData = formData.get('data') as string;
    const data = rawData ? JSON.parse(rawData) : {};
    if (!imageFile) return NextResponse.json({ error: 'No image' }, { status: 400 });

    const { roomType = 'living room', style = 'modern minimalist', prompt = '', strength = 0.85 } = data;
    const comfyInputDir = process.env.COMFY_INPUT || '/home/nikhil/Documents/Remo2/ComfyUI/input';
    await mkdir(comfyInputDir, { recursive: true });
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const fn = `interior_render_${Date.now()}.png`;
    await sharp(buffer).resize(1024, 1024, { fit: 'inside', withoutEnlargement: true }).png().toFile(path.join(comfyInputDir, fn));
    await mkdir(path.join(process.cwd(), 'public', 'uploads'), { recursive: true });
    await writeFile(path.join(process.cwd(), 'public', 'uploads', fn), buffer);

    let referenceImage: string | null = null;
    const refFile = formData.get('referenceImage') as File | null;
    if (refFile) { const rb = Buffer.from(await refFile.arrayBuffer()); const rf = `interior_ref_${Date.now()}.png`; await sharp(rb).resize(1024, 1024, { fit: 'inside', withoutEnlargement: true }).png().toFile(path.join(comfyInputDir, rf)); referenceImage = rf; }

    const project = await Project.create({ name: `Interior Render — ${roomType}`, userId: finalUserId, originalImage: `/uploads/${fn}`, status: 'queued', processingType: 'tool-interior-render', aiConfig: { roomType, style, prompt, strength } });
    comfyBridge.enqueueSmartTabJob(project._id.toString(), 'interior-render', { imageFilename: fn, roomType, style, prompt, strength, referenceImage }).catch((e: any) => console.error('❌ Interior render error:', e.message));
    return NextResponse.json({ success: true, projectId: project._id, tab: 'interior-render', status: 'queued' });
  } catch (error: any) { return NextResponse.json({ error: 'Interior render failed', message: error.message }, { status: 500 }); }
}

export async function GET(request: Request) {
  await connectDB();
  const projectId = new URL(request.url).searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });
  const project = await Project.findById(projectId);
  return project ? NextResponse.json(project) : NextResponse.json({ error: 'Not found' }, { status: 404 });
}
