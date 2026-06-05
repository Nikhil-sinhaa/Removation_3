import { Readable } from 'stream';
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { connectDB } from '@/lib/db/mongodb';
import Project from '@/src/models/Project';
import User from '@/lib/db/models/User';
import LightingRun from '@/src/models/LightingRun';
import { getCurrentUser } from '@/lib/auth/jwt';
import { saveImageForComfy, saveUploadPreview } from '@/lib/ai/save-image-for-comfy';
import { runLightingWorkflow, LIGHTING_PRESETS } from '@/src/services/lightingOrchestrator';
import { checkAndDeductCredits } from '@/lib/ai/deductCredits';

export const runtime = 'nodejs';

// Turbopack-safe multipart formData parser
async function safeParseFormData(request: Request): Promise<any> {
  try {
    return await request.formData();
  } catch (_) {
    const Busboy = (await import('busboy')).default;
    const contentType = request.headers.get('content-type') || '';
    return new Promise(async (resolve, reject) => {
      const fields = new Map();
      const files = new Map();
      const bb = Busboy({ headers: { 'content-type': contentType } });
      bb.on('file', (fieldname, fileStream, info) => {
        const { filename, mimeType } = info;
        const chunks: any[] = [];
        fileStream.on('data', c => chunks.push(c));
        fileStream.on('end', () => {
          const buffer = Buffer.concat(chunks);
          const blob = new Blob([buffer], { type: mimeType }) as any;
          blob.name = filename;
          blob.arrayBuffer = async () =>
            buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
          files.set(fieldname, blob);
        });
      });
      bb.on('field', (fieldname, value) => fields.set(fieldname, value));
      bb.on('close', () => resolve({ get: (k: string) => files.get(k) || fields.get(k) || null }));
      bb.on('error', reject);
      const ab = await request.arrayBuffer();
      Readable.from(Buffer.from(ab)).pipe(bb);
    });
  }
}

export async function POST(request: Request) {
  await connectDB();

  try {
    // ── Authentication ────────────────────────────────────────────────────────
    const authUser = await getCurrentUser();
    const clerkId = authUser?.id;
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = await User.findOne({ clerkId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const userId = String(user._id);

    // ── Parse Body ───────────────────────────────────────────────────────────
    const formData = await safeParseFormData(request);
    const imageFile = (formData.get('image') || formData.get('roomImage')) as File | null;
    const rawData = formData.get('data') as string;
    const data = rawData ? JSON.parse(rawData) : {};

    const {
      preset,
      manualPrompt,
      shape,
      lightX,
      lightY,
      canvasWidth,
      canvasHeight,
      lightWidth,
      lightHeight,
      spread,
      softness,
      invertLight,
      intensity,
      icMultiplier,
      denoise,
      cfg,
      frames
    } = data;

    // ── Validation ───────────────────────────────────────────────────────────
    if (!imageFile) {
      return NextResponse.json({ error: 'No input image provided' }, { status: 400 });
    }

    const presets = LIGHTING_PRESETS as Record<string, any>;
    if (preset && !presets[preset]) {
      return NextResponse.json({ error: `Invalid preset selected: ${preset}` }, { status: 400 });
    }

    // ── Save Uploaded Image ──────────────────────────────────────────────────
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadFilename = `lighting_${Date.now()}_${imageFile.name || 'room.png'}`;

    // Read actual dimensions of uploaded image using sharp
    let finalImageWidth = data.imageWidth;
    let finalImageHeight = data.imageHeight;
    try {
      const metadata = await sharp(buffer).metadata();
      if (metadata.width) finalImageWidth = metadata.width;
      if (metadata.height) finalImageHeight = metadata.height;
      console.log(`[Lighting API] Sharp parsed dimensions: ${finalImageWidth}x${finalImageHeight}`);
    } catch (err: any) {
      console.warn('[Lighting API] Sharp failed to read image dimensions:', err.message);
    }

    if (!finalImageWidth || !finalImageHeight) {
      finalImageWidth = 512;
      finalImageHeight = 512;
    }

    // 1. Save local preview image in /uploads/
    const inputImageUrl = await saveUploadPreview(buffer, uploadFilename);

    // 2. Save image to ComfyUI input folder
    let comfyFilename = '';
    const pngFilename = uploadFilename.replace(/\.[^.]+$/, '.png');
    try {
      comfyFilename = await saveImageForComfy(buffer, pngFilename);
    } catch {
      comfyFilename = await saveImageForComfy(buffer, uploadFilename);
    }

    // ── Create Project document ──────────────────────────────────────────────
    const label = preset ? (presets[preset]?.label || preset) : 'Custom Studio';
    const project = await Project.create({
      name: `Lighting — ${label}`,
      userId,
      originalImage: inputImageUrl || '',
      status: 'queued',
      processingType: 'lighting',
      aiConfig: {
        preset,
        manualPrompt,
        shape,
        lightX,
        lightY,
        canvasWidth,
        canvasHeight,
        lightWidth,
        lightHeight,
        spread,
        softness,
        invertLight,
        intensity,
        icMultiplier,
        denoise,
        cfg,
        frames
      }
    });

    const projId = String(project._id);

    // ── Run synchronously ───────────────────────────────────────────────
    const creditResult = await checkAndDeductCredits(clerkId, 'lighting');
    if (!creditResult.success) throw new Error(`insufficient_credits: ${creditResult.reason}`);

    const output = await runLightingWorkflow({
      comfyFilename,
      imageWidth: finalImageWidth,
      imageHeight: finalImageHeight,
      preset,
      manualPrompt,
      shape,
      lightX,
      lightY,
      canvasWidth,
      canvasHeight,
      lightWidth,
      lightHeight,
      spread,
      softness,
      invertLight,
      intensity,
      icMultiplier,
      denoise,
      cfg,
      frames,
      saveFilename: `lighting_${projId}`,
      projectId: projId,
      userId,
      clerkId,
      inputImageUrl,
      emitProgress: () => {},
    });

    return NextResponse.json({
      success: true,
      projectId: projId,
      imageUrl: (output as any)?.imageUrl || null,
    }, { status: 200 });

  } catch (error: any) {
    console.error('❌ /api/ai/lighting POST error:', error.message);
    if (error?.code === 'insufficient_credits' || error?.message?.includes('insufficient_credits')) {
      return NextResponse.json({
        error: 'insufficient_credits',
        message: error.message,
      }, { status: 402 });
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  await connectDB();
  const authUser = await getCurrentUser();
  if (!authUser || !authUser.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await User.findOne({ clerkId: authUser.id });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }

  try {
    const project = await Project.findOne({ _id: projectId, userId: user._id }).lean();
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Fetch the latest runs for this project
    const run = await LightingRun.findOne({ projectId }).sort({ createdAt: -1 }).lean();

    const results = run ? run.results : [];

    return NextResponse.json({
      status: project.status,
      resultImage: project.resultImage,
      errorMessage: project.errorMessage,
      results,
      runId: run ? String(run._id) : null,
      isBatch: run ? run.isBatch : (project.aiConfig?.frames && project.aiConfig.frames > 1)
    });
  } catch (error: any) {
    console.error('❌ /api/ai/lighting GET error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
