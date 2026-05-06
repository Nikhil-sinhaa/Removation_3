/**
 * API Route: Ultra-Pro 6-Stage Interior Design Pipeline
 * POST /api/ai/ultra-pro
 *
 * Triggers the multi-stage pipeline (see src/workflows/ultraProBuilder.js for full details):
 *   Stage 1: CLIPSeg (BatchCLIPSeg + DownloadAndLoadCLIPSeg) segmentation
 *            + DepthAnythingV2 depth map generation
 *            → outputs: wall_mask, floor_mask, object_mask, empty_mask, depth_map
 *   Stage 2: Single Canny ControlNet geometry locking (controlnet-canny-sdxl.safetensors)
 *            + depth-canny second ControlNet pass for spatial guidance
 *            → output: redesigned base image
 *   Stage 3: Sequential regional inpainting (walls first, then furniture)
 *            using VAEEncodeForInpaint + GrowMask
 *            → output: regional_inpainted
 *   Stage 4: IPAdapterUnifiedLoader (PLUS high strength) furniture placement [OPTIONAL]
 *            Requires furniture image upload + IPAdapter/CLIP-ViT-H model weights
 *            → output: furniture_placed
 *   Stage 5: Light KSampler inpainting refinement (denoise 0.30) [independently skippable]
 *            → output: refined
 *   Stage 6: RealESRGAN_x4plus 4× upscale → 2× downscale → SDXL hi-res pass
 *            + ImageSharpen [independently skippable]
 *            → output: ultra_hd_result
 */

import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { Readable } from 'stream';
import { connectDB } from '../../../../src/lib/mongodb.js';
import Project from '../../../../src/models/Project.js';
import comfyBridge from '../../../../src/services/comfyBridge.js';
import { NextResponse } from 'next/server';
import sharp from 'sharp';

export const runtime = 'nodejs';

// ─── Turbopack-safe FormData parser (same as redesign/route.js) ──────
async function safeParseFormData(request) {
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
        const chunks = [];
        fileStream.on('data', (c) => chunks.push(c));
        fileStream.on('end', () => {
          const buffer = Buffer.concat(chunks);
          const blob = new Blob([buffer], { type: mimeType });
          blob.name = filename;
          blob.arrayBuffer = async () => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
          files.set(fieldname, blob);
        });
      });
      bb.on('field', (fieldname, value) => fields.set(fieldname, value));
      bb.on('close', () => resolve({ get: (k) => files.get(k) || fields.get(k) || null }));
      bb.on('error', reject);
      const ab = await request.arrayBuffer();
      Readable.from(Buffer.from(ab)).pipe(bb);
    });
  }
}

// ─── POST /api/ai/ultra-pro ──────────────────────────────────────────

export async function POST(request) {
  await connectDB();

  try {
    console.log('✨ Starting Ultra-Pro pipeline...');

    const formData = await safeParseFormData(request);
    const imageFile = formData.get('image');
    const rawData = formData.get('data');
    const data = rawData ? JSON.parse(rawData) : {};

    const roomType       = data.roomType       || 'Living Room';
    const masterSelector = data.masterSelector || {};
    const masterToggles  = data.masterToggles  || {};
    const furnitureImageFile = formData.get('furnitureImage');  // actual File from FormData
    const styleReference = data.styleReference || null;
    const skipStages     = data.skipStages     || [];
    // ProfessionalSelector structural lock params (canny thresholds, ControlNet strength)
    const structuralLock = data.structuralLock || {};

    if (!imageFile) {
      return Response.json({ error: 'No image provided' }, { status: 400 });
    }

    // Save uploaded image
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });
    const uploadFilename = `ultrapro_${Date.now()}_${imageFile.name}`;
    const uploadPath = path.join(uploadsDir, uploadFilename);
    await writeFile(uploadPath, buffer);

    // Convert to PNG, fit within SDXL max (no cropping — preserves full image)
    const comfyInputDir = '/home/nikhil/Documents/Remo2/ComfyUI/input';
    await mkdir(comfyInputDir, { recursive: true });
    const comfyFilename = uploadFilename.replace(/\.[^.]+$/, '.png');
    const comfyInputPath = path.join(comfyInputDir, comfyFilename);

    try {
      await sharp(buffer)
        .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
        .png()
        .toFile(comfyInputPath);
      console.log(`✅ Image → PNG (fit inside 1024, no crop): ${comfyFilename}`);
    } catch (sharpErr) {
      console.warn(`⚠️ Sharp failed, copying raw: ${sharpErr.message}`);
      const { copyFile } = await import('fs/promises');
      await copyFile(uploadPath, path.join(comfyInputDir, uploadFilename));
    }

    // Save furniture image to ComfyUI/input (if provided)
    let furnitureImage = null;
    if (furnitureImageFile && typeof furnitureImageFile !== 'string') {
      try {
        const furnBytes = await furnitureImageFile.arrayBuffer();
        const furnBuffer = Buffer.from(furnBytes);
        const furnFilename = `furniture_${Date.now()}.png`;
        const furnPath = path.join(comfyInputDir, furnFilename);
        await sharp(furnBuffer)
          .resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toFile(furnPath);
        furnitureImage = furnFilename;
        console.log(`✅ Furniture image → PNG: ${furnFilename}`);
      } catch (furnErr) {
        console.warn(`⚠️ Furniture image processing failed: ${furnErr.message}`);
      }
    }

    // ─── IPAdapter Pre-flight: Verify model weights exist before Stage 4 runs ──
    // If missing, auto-skip Stage 4 and warn the user instead of failing mid-pipeline
    // with a cryptic "ComfyUI execution error — check VRAM or workflow" message.
    let ipadapterAvailable = false;
    let ipadapterWarning = null;
    if (furnitureImage) {
      const COMFY_BASE = process.env.COMFY_BASE || '/home/nikhil/Documents/Remo2/ComfyUI';
      const { access: fsAccess } = await import('fs/promises');
      const requiredModels = [
        { path: `${COMFY_BASE}/models/ipadapter/ip-adapter-plus_sdxl_vit-h.safetensors`, label: 'IPAdapter Plus SDXL' },
        { path: `${COMFY_BASE}/models/clip_vision/CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors`, label: 'CLIP ViT-H' },
      ];
      const missing = [];
      for (const model of requiredModels) {
        try { await fsAccess(model.path); }
        catch { missing.push(model.label); }
      }
      if (missing.length === 0) {
        ipadapterAvailable = true;
        console.log('✅ IPAdapter models verified — Stage 4 will run');
      } else {
        ipadapterWarning = `Stage 4 skipped: missing models — ${missing.join(', ')}. Upload these to ComfyUI/models/ipadapter/ and clip_vision/.`;
        console.warn(`⚠️ ${ipadapterWarning}`);
        if (!skipStages.includes(4)) skipStages.push(4);
      }
    }

    // Create project record
    const project = await Project.create({
      name:           `Ultra-Pro ${roomType}`,
      userId:         '000000000000000000000000',
      originalImage:  `/uploads/${uploadFilename}`,
      status:         'queued',
      processingType: 'ultra-pro',
      aiConfig: {
        style: 'ultra-pro',
        roomType,
        masterSelector,
        masterToggles,
        furnitureImage,
        skipStages,
        seed: Math.floor(Math.random() * 999999999),
      },
    });

    // Fire-and-forget: start the multi-stage pipeline in the background
    comfyBridge.enqueueUltraProJob(project._id.toString(), {
      imageFilename: comfyFilename,
      roomType,
      masterSelector,
      masterToggles,
      furnitureImage,
      styleReference,
      skipStages,
      structuralLock,
    }).catch(err => {
      console.error('❌ Ultra-Pro background error:', err.message);
    });

    return Response.json({
      success:            true,
      projectId:          project._id,
      status:             'queued',
      message:            'Ultra-Pro pipeline started (6 stages)',
      mode:               'ultra-pro',
      estimatedTime:      300,
      stages:             6 - skipStages.length,
      ipadapterAvailable,
      ...(ipadapterWarning && { ipadapterWarning }),
    });

  } catch (error) {
    console.error('❌ Ultra-Pro API error:', error);
    return Response.json(
      { error: 'Ultra-Pro pipeline failed', message: error.message },
      { status: 500 }
    );
  }
}

// ─── GET /api/ai/ultra-pro?projectId=xxx ─────────────────────────────

export async function GET(request) {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) {
    return Response.json({ error: 'projectId required' }, { status: 400 });
  }

  const project = await Project.findById(projectId);
  if (!project) {
    return Response.json({ error: 'Project not found' }, { status: 404 });
  }
  return Response.json(project);
}
