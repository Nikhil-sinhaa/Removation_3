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
import { getPresetById, getReferenceById, getVariantById } from '@/config/style-presets';
import { getStyleReferenceImage } from '@/lib/utils/styleReferences';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  await connectDB();
  try {
    const authUser = await getCurrentUser();
    if (!authUser || !authUser.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const finalUserId = authUser.id;

    const formData = await request.formData();

    // ── Room image (required) ────────────────────────────────────────────────
    const roomImageFile = (formData.get('roomImage') || formData.get('image')) as File | null;
    if (!roomImageFile) {
      return NextResponse.json({ error: 'Room image is required.' }, { status: 400 });
    }

    // ── Preset & reference metadata ─────────────────────────────────────────
    const presetId         = (formData.get('presetId')       || formData.get('stylePreset') || 'japandi') as string;
    const roomType         = (formData.get('roomType')        || 'livingroom') as string;
    const variantId        = (formData.get('variantId')       || '') as string;
    const referenceId      = (formData.get('referenceId')     || '') as string;
    const promptOverride   = (formData.get('prompt')          || '') as string;
    const negativeOverride = (formData.get('negativePrompt')  || '') as string;
    const strength         = parseFloat((formData.get('strength') || '0.7') as string);
    const preserveStructure = (formData.get('preserveStructure') || 'true') === 'true';

    // ── Style reference resolution (priority: custom file > legacy URL > auto-pick) ──
    const referenceImageFile = formData.get('referenceImageFile') as File | null;
    const referenceImageUrl  = (formData.get('referenceImageUrl') || '') as string;

    // Resolve prompt from preset + variant config
    const preset = getPresetById(presetId);
    const referenceConfig = referenceId ? getReferenceById(presetId, referenceId) : null;
    const variant = variantId ? getVariantById(presetId, variantId) : null;

    const positivePrompt = promptOverride
      || referenceConfig?.prompt
      || ((preset?.defaultPrompt || '') + (variant?.promptSuffix || ''))
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
      // Priority 1: custom uploaded file
      styleBuffer = Buffer.from(await referenceImageFile.arrayBuffer());
      styleFn     = `style_ref_custom_${timestamp}.png`;
    } else if (referenceImageUrl) {
      // Priority 2: legacy referenceImageUrl field (backward compat)
      try {
        let rawBuf: Buffer;
        if (referenceImageUrl.startsWith('/')) {
          const localPath = path.join(process.cwd(), 'public', referenceImageUrl);
          rawBuf = await import('fs/promises').then(fs => fs.readFile(localPath));
        } else {
          const res = await fetch(referenceImageUrl);
          if (!res.ok) throw new Error(`Failed to fetch reference image: ${res.status}`);
          rawBuf = Buffer.from(await res.arrayBuffer());
        }
        styleBuffer = rawBuf;
        styleFn     = `style_ref_preset_${timestamp}.png`;
      } catch (err: any) {
        console.error('[StyleTransferRoute] Failed to load reference image:', err.message);
        styleFn = '';
      }
    } else {
      // Priority 3: auto-pick from style-references based on presetId + roomType
      const autoRefPath = getStyleReferenceImage(presetId, roomType);
      try {
        const localPath = path.join(process.cwd(), 'public', autoRefPath);
        styleBuffer = await import('fs/promises').then(fs => fs.readFile(localPath));
        styleFn     = `style_ref_auto_${timestamp}.png`;
      } catch (err: any) {
        console.error('[StyleTransferRoute] Failed to load auto reference:', err.message);
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
        roomType,
        variantId: variantId || null,
        referenceId: referenceId || null,
        styleImage: styleFn ? `/uploads/${styleFn}` : null,
        prompt: positivePrompt,
        negativePrompt,
        strength,
        preserveStructure,
      },
    });

    const projId = project._id.toString();

    // ── Run synchronously ─────────────────────────────────────────────────────
    const creditResult = await checkAndDeductCredits(finalUserId, 'style-transfer');
    if (!creditResult.success) throw new Error(`insufficient_credits: ${creditResult.reason}`);

    const output = await runStyleTransfer({
      roomImageFilename: roomFn,
      styleImageFilename: styleFn || roomFn,
      inputImageUrl: `/uploads/${roomFn}`,
      styleImageUrl: styleFn ? `/uploads/${styleFn}` : `/uploads/${roomFn}`,
      stylePresetId: presetId,
      positivePrompt,
      negativePrompt,
      projectId: projId,
      userId: finalUserId,
    });

    return NextResponse.json({
      success: true,
      projectId: project._id,
      imageUrl: (output as any)?.imageUrl || null,
    }, { status: 200 });

  } catch (error: any) {
    console.error('❌ Style transfer POST error:', error);
    if (error?.code === 'insufficient_credits' || error?.message?.includes('insufficient_credits')) {
      return NextResponse.json({
        error: 'insufficient_credits',
        message: error.message,
      }, { status: 402 });
    }
    return NextResponse.json(
      { error: 'Style transfer failed', message: error.message },
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
