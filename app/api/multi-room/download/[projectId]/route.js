import { NextResponse } from 'next/server';
import JSZip from 'jszip';
import path from 'path';
import fs from 'fs';
import MultiRoomProject from '@/src/models/MultiRoomProject';
import { connectDB } from '@/lib/db/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  await connectDB();

  const { projectId } = await params;
  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }

  // Support both MultiRoomProject ID and main Project ID
  let project = null;

  try {
    project = await MultiRoomProject.findById(projectId);
  } catch (e) {}

  // Try via main Project metadata or aiConfig
  if (!project) {
    try {
      const { default: Project } = await import('@/src/models/Project');
      const mainProject = await Project.findById(projectId);
      const multiRoomProjectId = mainProject?.metadata?.multiRoomProjectId || mainProject?.aiConfig?.multiRoomProjectId;
      if (multiRoomProjectId) {
        project = await MultiRoomProject.findById(multiRoomProjectId);
      }
    } catch (e) {}
  }

  if (!project) {
    return NextResponse.json(
      { error: 'Project not found' },
      { status: 404 }
    );
  }

  const zip = new JSZip();
  const pid = project._id.toString();

  // Create input and output folders inside project ID folder
  const inputFolder  = zip.folder(`${pid}/input`);
  const outputFolder = zip.folder(`${pid}/output`);

  const publicDir = path.join(process.cwd(), 'public');

  let inputCount  = 0;
  let outputCount = 0;

  for (const photo of project.photos) {
    const index = String(photo.order + 1).padStart(2, '0');

    // INPUT — original uploaded photo
    if (photo.originalUrl) {
      try {
        const filePath = path.join(
          publicDir,
          photo.originalUrl.replace(/^\//, '')
        );
        if (fs.existsSync(filePath)) {
          const buffer = fs.readFileSync(filePath);
          const ext = path.extname(filePath) || '.jpg';
          inputFolder.file(
            `${pid}_input_${index}${ext}`,
            buffer
          );
          inputCount++;
        }
      } catch (e) {
        console.error(`Input photo ${index} read error:`, e.message);
      }
    }

    // OUTPUT — painted photo
    if (photo.paintedUrl) {
      try {
        const filePath = path.join(
          publicDir,
          photo.paintedUrl.replace(/^\//, '')
        );
        if (fs.existsSync(filePath)) {
          const buffer = fs.readFileSync(filePath);
          const ext = path.extname(filePath) || '.jpg';
          outputFolder.file(
            `${pid}_output_${index}${ext}`,
            buffer
          );
          outputCount++;
        }
      } catch (e) {
        console.error(`Output photo ${index} read error:`, e.message);
      }
    }
  }

  if (inputCount === 0 && outputCount === 0) {
    return NextResponse.json(
      { error: 'No images found for this project' },
      { status: 404 }
    );
  }

  // Generate ZIP buffer
  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  return new NextResponse(zipBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${pid}.zip"`,
      'Content-Length': zipBuffer.length.toString(),
    },
  });
}
