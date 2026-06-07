/**
 * Tool 1: Auto Edit — Text-driven object change
 * POST /api/ai/auto-edit
 * Body: image + data: { objectToEdit, editDescription, denoise }
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

export const runtime = 'nodejs';

export async function POST(request: Request) {
  await connectDB();
  try {
    const authUser = await getCurrentUser();
    if (!authUser || !authUser.id) {
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

    const deductResult = await checkAndDeductCredits(finalUserId, 'auto-edit');
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
    const rawData = formData.get('data') as string;
    const data = rawData ? JSON.parse(rawData) : {};
    if (!imageFile) return NextResponse.json({ error: 'No image' }, { status: 400 });

    const { objectToEdit = 'wall', editDescription = 'white painted wall', denoise = 0.55, detectThreshold = 0.35 } = data;
    const comfyInputDir = process.env.COMFY_INPUT || '/home/nikhil/Documents/Remo2/ComfyUI/input';
    await mkdir(comfyInputDir, { recursive: true });
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const fn = `auto_edit_${Date.now()}.png`;
    await sharp(buffer).resize(1024, 1024, { fit: 'inside', withoutEnlargement: true }).png().toFile(path.join(comfyInputDir, fn));
    await mkdir(path.join(process.cwd(), 'public', 'uploads'), { recursive: true });
    await writeFile(path.join(process.cwd(), 'public', 'uploads', fn), buffer);

    const project = await AIRun.create({ name: `Auto Edit — ${objectToEdit}`, userId: finalUserId, originalImage: `/uploads/${fn}`, status: 'queued', processingType: 'tool-auto-edit', aiConfig: { objectToEdit, editDescription, denoise } });
    comfyBridge.enqueueSmartTabJob(project._id.toString(), 'auto-edit', { imageFilename: fn, objectToEdit, editDescription, denoise, detectThreshold }).catch((e: any) => console.error('❌ Auto-edit error:', e.message));
    return NextResponse.json({ success: true, projectId: project._id, tab: 'auto-edit', status: 'queued' });
  } catch (error: any) { return NextResponse.json({ error: 'Auto-edit failed', message: error.message }, { status: 500 }); }
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
