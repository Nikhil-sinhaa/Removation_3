/**
 * Tool 9: Collage / Moodboard
 */
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { connectDB } from '@/lib/db/mongodb';
import AIRun from '@/src/models/AIRun';
import comfyBridge from '@/src/services/comfyBridge';
import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { getCurrentUser } from '@/lib/auth/jwt';
import { checkAndDeductCredits } from '@/lib/ai/deductCredits';
import { getQueueDepth } from '@/lib/redis/aiQueue';
import { tryAcquireRenderLock } from '@/lib/redis/lock';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  await connectDB();
  try {
    const authUser = await getCurrentUser();
    if (!authUser || !authUser.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const finalUserId = authUser.id;

    if (process.env.COMFYUI_ENABLED === 'false') {
      return NextResponse.json({ error: 'ComfyUI features are not available in this deployment.' }, { status: 503 });
    }

    const queueDepth = await getQueueDepth();
    if (queueDepth >= 10) {
      return NextResponse.json(
        { error: 'Server is busy. Please try again in a few minutes.' },
        { status: 503 }
      );
    }

    const renderLock = await tryAcquireRenderLock(finalUserId, 'collage');
    if (!renderLock) {
      return NextResponse.json({ error: 'render_in_progress', message: 'A render is already in progress for this tool. Please wait a moment.' }, { status: 429 });
    }

    const deductResult = await checkAndDeductCredits(finalUserId, 'collage');
    if (!deductResult.success) {
      return NextResponse.json({
        error: 'insufficient_credits',
        message: deductResult.reason,
        remainingCredits: deductResult.remaining,
        upgradeUrl: '/pricing'
      }, { status: 402 });
    }

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
    const project = await AIRun.create({ name: 'Collage', userId: finalUserId, originalImage: `/uploads/${fn}`, status: 'queued', processingType: 'tool-collage', aiConfig: { prompt, strength } });
    comfyBridge.enqueueTabJob(project._id.toString(), 'collage', { imageFilename: fn, referenceImages, prompt, strength }).catch((e: any) => console.error('❌ Collage error:', e.message));
    return NextResponse.json({ success: true, projectId: project._id, tab: 'collage', status: 'queued' });
  } catch (error: any) { return NextResponse.json({ error: 'Collage failed', message: error.message }, { status: 500 }); }
}

export async function GET(request: Request) {
  await connectDB();
  const authUser = await getCurrentUser();
  if (!authUser || !authUser.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const projectId = new URL(request.url).searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });
  const project = await AIRun.findOne({ _id: projectId, userId: authUser.id });
  return project ? NextResponse.json(project) : NextResponse.json({ error: 'Not found' }, { status: 404 });
}
