/**
 * Style Transfer API Route
 *
 * Handles client style transfer requests. Accepts a room image + a style reference,
 * which can come from three sources (priority order):
 *   1. referenceImageFile — custom uploaded file from the user
 *   2. referenceImageUrl  — URL of a preset gallery image (downloaded server-side)
 *   3. fallback           — text-prompt only (no image reference)
 *
 * The reference image is saved to ComfyUI/input/ and injected as the IP-Adapter input.
 */

import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { connectDB } from '@/lib/db/mongodb';
import Project from '@/src/models/Project';
import { runStyleTransfer } from '@/src/services/styleTransferOrchestrator';
import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { checkIPAdapterModels, IPADAPTER_MISSING_ERROR } from '@/lib/ai/preflight';
import { getCurrentUser } from '@/lib/auth/jwt';
import { checkAndDeductCredits } from '@/lib/ai/deductCredits';
import { getPresetById, getReferenceById } from '@/config/style-presets';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  await connectDB();
  try {
    const authUser = await getCurrentUser();
    if (!authUser || !authUser.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const finalUserId = authUser.id;

    const deductResult = await checkAndDeductCredits(finalUserId, 'style-transfer');
    if (!deductResult.success) {
      return NextResponse.json({
        error: 'insufficient_credits',
        message: deductResult.reason,
        remainingCredits: deductResult.remaining,
        upgradeUrl: '/pricing'
      }, { status: 402 });
    }

    const formData = await request.formData();

    // ── Room image (required) ────────────────────────────────────────────────
    const roomImageFile = (formData.get('roomImage') || formData.get('image')) as File | null;
    if (!roomImageFile) {
      return NextResponse.json({ error: 'Room image is required.' }, { status: 400 });
    }

    // ── Preset & reference metadata ─────────────────────────────────────────
    const presetId    = (formData.get('presetId')     || formData.get('stylePreset') || 'japandi') as string;
    const referenceId = (formData.get('referenceId')  || '') as string;
    const promptOverride     = (formData.get('prompt')         || '') as string;
    const negativeOverride   = (formData.get('negativePrompt') || '') as string;

    // ── Style reference resolution (priority: custom file > preset URL > fallback) ──
    // 1. Custom file upload
    const referenceImageFile = formData.get('referenceImageFile') as File | null;
    // 2. Preset gallery URL
    const referenceImageUrl  = (formData.get('referenceImageUrl') || '') as string;

    // Resolve prompt from preset config
    const preset = getPresetById(presetId);
    const referenceConfig = referenceId ? getReferenceById(presetId, referenceId) : null;

    const positivePrompt = promptOverride
      || referenceConfig?.prompt
      || preset?.defaultPrompt
      || 'interior design, high quality, photorealistic, (professional architectural photography:1.3)';

    const negativePrompt = negativeOverride
      || referenceConfig?.negativePrompt
      || preset?.defaultNegativePrompt
      || 'low quality, blurry, distorted, unrealistic, cartoon, watermark';

    // ── IP-Adapter pre-flight ────────────────────────────────────────────────
    const ipOk = await checkIPAdapterModels();
    if (!ipOk) {
      return NextResponse.json(IPADAPTER_MISSING_ERROR, { status: 422 });
    }

    const comfyInputDir = process.env.COMFY_INPUT || '/home/nikhil/Documents/Remo2/ComfyUI/input';
    const uploadsDir    = path.join(process.cwd(), 'public', 'uploads');

    await mkdir(comfyInputDir, { recursive: true });
    await mkdir(uploadsDir,    { recursive: true });

    const timestamp = Date.now();
    const roomFn    = `style_room_${timestamp}.png`;
    let   styleFn   = '';

    // ── Process room image ───────────────────────────────────────────────────
    const roomBuffer = Buffer.from(await roomImageFile.arrayBuffer());
    const processedRoom = await sharp(roomBuffer)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .png()
      .toBuffer();

    await writeFile(path.join(comfyInputDir, roomFn), processedRoom);
    await writeFile(path.join(uploadsDir,    roomFn), processedRoom);

    // ── Process style reference image ────────────────────────────────────────
    let styleBuffer: Buffer | null = null;

    if (referenceImageFile) {
      // Custom uploaded file takes highest priority
      styleBuffer = Buffer.from(await referenceImageFile.arrayBuffer());
      styleFn     = `style_ref_custom_${timestamp}.png`;
    } else if (referenceImageUrl) {
      // Preset gallery image — the URL is a local public path or absolute URL
      try {
        let rawBuf: Buffer;
        if (referenceImageUrl.startsWith('/')) {
          // Local public asset
          const localPath = path.join(process.cwd(), 'public', referenceImageUrl);
          rawBuf = await import('fs/promises').then(fs => fs.readFile(localPath));
        } else {
          // External URL (shouldn't happen in normal flow, but handle gracefully)
          const res = await fetch(referenceImageUrl);
          if (!res.ok) throw new Error(`Failed to fetch reference image: ${res.status}`);
          rawBuf = Buffer.from(await res.arrayBuffer());
        }
        styleBuffer = rawBuf;
        styleFn     = `style_ref_preset_${timestamp}.png`;
      } catch (err: any) {
        console.error('[StyleTransferRoute] Failed to load reference image:', err.message);
        // Fallback: proceed without image reference (text-prompt only)
        styleFn = '';
      }
    }

    if (styleBuffer && styleFn) {
      const processedStyle = await sharp(styleBuffer)
        .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
        .png()
        .toBuffer();
      await writeFile(path.join(comfyInputDir, styleFn), processedStyle);
      await writeFile(path.join(uploadsDir,    styleFn), processedStyle);
    }

    // ── Create Project record ────────────────────────────────────────────────
    const project = await Project.create({
      name: `Style Transfer (${preset?.label || presetId})`,
      userId: finalUserId,
      originalImage: `/uploads/${roomFn}`,
      status: 'queued',
      processingType: 'tool-style-transfer',
      aiConfig: {
        presetId,
        referenceId: referenceId || null,
        styleImage: styleFn ? `/uploads/${styleFn}` : null,
        prompt: positivePrompt,
        negativePrompt,
      },
    });

    // ── Fire and forget orchestrator ─────────────────────────────────────────
    runStyleTransfer({
      roomImageFilename: roomFn,
      styleImageFilename: styleFn || roomFn, // fallback to room if no reference
      inputImageUrl: `/uploads/${roomFn}`,
      styleImageUrl: styleFn ? `/uploads/${styleFn}` : `/uploads/${roomFn}`,
      stylePresetId: presetId,
      positivePrompt,
      negativePrompt,
      projectId: project._id.toString(),
      userId: finalUserId,
    }).catch((err) => {
      console.error(`[StyleTransferRoute] Background orchestration failed for project ${project._id}:`, err);
    });

    return NextResponse.json({
      success: true,
      projectId: project._id,
      processingType: 'tool-style-transfer',
      status: 'queued',
    });

  } catch (error: any) {
    console.error('❌ Style transfer POST error:', error);
    return NextResponse.json(
      { error: 'Style transfer failed to start', message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  await connectDB();
  try {
    const authUser = await getCurrentUser();
    if (!authUser || !authUser.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = new URL(request.url).searchParams.get('projectId');
    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const project = await Project.findOne({ _id: projectId, userId: authUser.id });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error: any) {
    console.error('❌ Style transfer GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve project status', message: error.message },
      { status: 500 }
    );
  }
}
