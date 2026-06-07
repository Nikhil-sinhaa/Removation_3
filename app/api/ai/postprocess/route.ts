/**
 * API Route: Post-Process Tab
 * POST /api/ai/postprocess — 4× Upscale + Sharpen + Color Grade
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

export const runtime = 'nodejs';

export async function POST(request: Request) {
  await connectDB();
  try {
    const authUser = await getCurrentUser();
    if (!authUser || !authUser.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const finalUserId = authUser.id;

    const deductResult = await checkAndDeductCredits(finalUserId, 'postprocess');
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

    const project = await AIRun.create({
      name: `Post-Process — ${colorGrade}`, userId: finalUserId,
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
  const authUser = await getCurrentUser();
  if (!authUser || !authUser.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });
  const project = await AIRun.findOne({ _id: projectId, userId: authUser.id });
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(project);
}
