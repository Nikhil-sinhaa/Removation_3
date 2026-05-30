/**
 * Style Transfer API Route
 *
 * Handles client style transfer requests by saving the room & style images,
 * registering the Project model, and executing the ComfyUI generation pipeline.
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
    
    // Support both roomImage/styleImage and image/referenceImage for full backward compatibility
    const roomImageFile = (formData.get('roomImage') || formData.get('image')) as File;
    const styleImageFile = (formData.get('styleImage') || formData.get('referenceImage')) as File;
    const stylePreset = (formData.get('stylePreset') || 'japandi') as string;

    if (!roomImageFile || !styleImageFile) {
      return NextResponse.json(
        { error: 'Both room image and style reference image are required.' },
        { status: 400 }
      );
    }

    // IPAdapter pre-flight check
    const ipOk = await checkIPAdapterModels();
    if (!ipOk) {
      return NextResponse.json(IPADAPTER_MISSING_ERROR, { status: 422 });
    }

    const comfyInputDir = process.env.COMFY_INPUT || '/home/nikhil/Documents/Remo2/ComfyUI/input';
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    await mkdir(comfyInputDir, { recursive: true });
    await mkdir(uploadsDir, { recursive: true });

    const timestamp = Date.now();
    const roomFn = `style_room_${timestamp}.png`;
    const styleFn = `style_ref_${timestamp}.png`;

    const roomBuffer = Buffer.from(await roomImageFile.arrayBuffer());
    const styleBuffer = Buffer.from(await styleImageFile.arrayBuffer());

    // 1. Process and save room image (using sharp for optimization & standardization to PNG)
    const roomPathComfy = path.join(comfyInputDir, roomFn);
    const roomPathUploads = path.join(uploadsDir, roomFn);
    
    const processedRoom = await sharp(roomBuffer)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .png()
      .toBuffer();

    await writeFile(roomPathComfy, processedRoom);
    await writeFile(roomPathUploads, processedRoom);

    // 2. Process and save style reference image
    const stylePathComfy = path.join(comfyInputDir, styleFn);
    const stylePathUploads = path.join(uploadsDir, styleFn);
    
    const processedStyle = await sharp(styleBuffer)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .png()
      .toBuffer();

    await writeFile(stylePathComfy, processedStyle);
    await writeFile(stylePathUploads, processedStyle);

    // 3. Create Project record in MongoDB
    const project = await Project.create({
      name: `Style Transfer (${stylePreset})`,
      userId: finalUserId,
      originalImage: `/uploads/${roomFn}`,
      status: 'queued',
      processingType: 'tool-style-transfer',
      aiConfig: {
        stylePreset,
        styleImage: `/uploads/${styleFn}`,
      },
    });

    // 4. Run Style Transfer Orchestrator in background
    runStyleTransfer({
      roomImageFilename: roomFn,
      styleImageFilename: styleFn,
      inputImageUrl: `/uploads/${roomFn}`,
      styleImageUrl: `/uploads/${styleFn}`,
      stylePresetId: stylePreset,
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
