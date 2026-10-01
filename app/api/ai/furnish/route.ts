/**
 * API Route: Furnish Tab
 * POST /api/ai/furnish
 *
 * Accepts room image + furniture image (direct upload or URL).
 * Pipeline: Download → BG removal (sharp) → save to ComfyUI/input →
 *           IPAdapter placement with depth-canny guidance.
 */

import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { Readable } from 'stream';
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

async function safeParseFormData(request: Request) {
  try {
    return await request.formData();
  } catch (_) {
    const Busboy = (await import('busboy')).default;
    const contentType = request.headers.get('content-type') || '';
    return new Promise<any>(async (resolve, reject) => {
      const fields = new Map();
      const files = new Map();
      const bb = Busboy({ headers: { 'content-type': contentType } });
      bb.on('file', (fieldname: string, fileStream: any, info: any) => {
        const { filename, mimeType } = info;
        const chunks: Buffer[] = [];
        fileStream.on('data', (c: Buffer) => chunks.push(c));
        fileStream.on('end', () => {
          const buffer = Buffer.concat(chunks);
          const blob: any = new Blob([buffer], { type: mimeType });
          blob.name = filename;
          blob.arrayBuffer = async () =>
            buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
          files.set(fieldname, blob);
        });
      });
      bb.on('field', (fieldname: string, value: string) => fields.set(fieldname, value));
      bb.on('close', () =>
        resolve({ get: (k: string) => files.get(k) || fields.get(k) || null })
      );
      bb.on('error', reject);
      const ab = await request.arrayBuffer();
      Readable.from(Buffer.from(ab)).pipe(bb);
    });
  }
}

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

    const renderLock = await tryAcquireRenderLock(finalUserId, 'furnish');
    if (!renderLock) {
      return NextResponse.json({ error: 'render_in_progress', message: 'A render is already in progress for this tool. Please wait a moment.' }, { status: 429 });
    }

    const deductResult = await checkAndDeductCredits(finalUserId, 'furnish');
    if (!deductResult.success) {
      return NextResponse.json({
        error: 'insufficient_credits',
        message: deductResult.reason,
        remainingCredits: deductResult.remaining,
        upgradeUrl: '/pricing'
      }, { status: 402 });
    }

    const formData = await safeParseFormData(request);
    const imageFile = formData.get('image');
    const furnitureFile = formData.get('furnitureImage');
    const rawData = formData.get('data');
    const data = rawData ? JSON.parse(rawData) : {};

    if (!imageFile) {
      return NextResponse.json({ error: 'Room image required' }, { status: 400 });
    }
    if (!furnitureFile) {
      return NextResponse.json({ error: 'Furniture image required' }, { status: 400 });
    }

    const {
      roomType = 'living room',
      prompt = '',
      furnitureUrl = null,
      placement = '',
      items = [],
    } = data;

    const comfyInputDir = process.env.COMFY_INPUT || '/home/nikhil/Documents/Remo2/ComfyUI/input';
    await mkdir(comfyInputDir, { recursive: true });

    // Save room image
    const imgBytes = await imageFile.arrayBuffer();
    const imgBuffer = Buffer.from(imgBytes);
    const imgFilename = `furnish_room_${Date.now()}.png`;
    await sharp(imgBuffer)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .png()
      .toFile(path.join(comfyInputDir, imgFilename));

    // Save furniture image (with transparent background padding)
    const furnBytes = await furnitureFile.arrayBuffer();
    const furnBuffer = Buffer.from(furnBytes);
    const furnFilename = `furnish_product_${Date.now()}.png`;
    await sharp(furnBuffer)
      .resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(comfyInputDir, furnFilename));

    // Save upload preview
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(path.join(uploadsDir, imgFilename), imgBuffer);

    // IPAdapter pre-flight check
    const COMFY_BASE = process.env.COMFY_BASE || '/home/nikhil/Documents/Remo2/ComfyUI';
    const { access: fsAccess } = await import('fs/promises');
    let ipadapterAvailable = false;
    try {
      await fsAccess(`${COMFY_BASE}/models/ipadapter/ip-adapter-plus_sdxl_vit-h.safetensors`);
      await fsAccess(`${COMFY_BASE}/models/clip_vision/CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors`);
      ipadapterAvailable = true;
    } catch {
      return NextResponse.json(
        { error: 'IPAdapter models not installed. Required: ip-adapter-plus_sdxl_vit-h.safetensors + CLIP-ViT-H-14' },
        { status: 422 }
      );
    }

    const project = await AIRun.create({
      name: items.length > 1
        ? `Furnish (${items.length} items) — ${roomType}`
        : `Furnish — ${roomType}`,
      userId: finalUserId,
      originalImage: `/uploads/${imgFilename}`,
      status: 'queued',
      processingType: 'tab-furnish',
      aiConfig: { roomType, prompt, furnitureUrl, placement, itemCount: items.length },
    });

    // enqueueSmartTabJob auto-runs Stage 1 scene analysis first,
    // providing emptyMask + depthMap so buildFurnishWorkflow skips CLIPSeg
    comfyBridge.enqueueSmartTabJob(project._id.toString(), 'furnish', {
      imageFilename: imgFilename,
      furnitureImage: furnFilename,
      roomType,
      prompt: prompt || undefined,
      placement: placement || undefined,
    }).catch((err: any) => console.error('❌ Furnish tab error:', err.message));

    return NextResponse.json({
      success: true,
      projectId: project._id,
      tab: 'furnish',
      status: 'queued',
      ipadapterAvailable,
    });
  } catch (error: any) {
    console.error('❌ Furnish API error:', error);
    return NextResponse.json(
      { error: 'Furnish failed', message: error.message },
      { status: 500 }
    );
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
