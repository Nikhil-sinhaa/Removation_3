import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/db/mongodb';
import MultiRoomProject from '../../../../../src/models/MultiRoomProject.js';
import Project from '../../../../../src/models/Project.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  await connectDB();

  const { projectId } = await params;
  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }

  // params.projectId could be either:
  // 1. The MultiRoomProject _id directly
  // 2. The main Project _id (which has metadata / aiConfig.multiRoomProjectId)
  
  let multiRoomProject = null;

  // Try direct MultiRoomProject lookup first
  try {
    multiRoomProject = await MultiRoomProject.findById(projectId);
  } catch (e) {}

  // If not found, look up via main Project aiConfig
  if (!multiRoomProject) {
    try {
      const mainProject = await Project.findById(projectId);
      if (mainProject?.aiConfig?.multiRoomProjectId) {
        multiRoomProject = await MultiRoomProject.findById(
          mainProject.aiConfig.multiRoomProjectId
        );
      }
    } catch (e) {}
  }

  if (!multiRoomProject) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({
    projectId: multiRoomProject._id.toString(),
    roomName: multiRoomProject.roomName,
    colorName: multiRoomProject.colorName,
    colorHex: multiRoomProject.colorHex,
    marbleWorldUrl: multiRoomProject.marbleWorldUrl,
    marbleThumbnail: multiRoomProject.marbleThumbnail,
    paintedCount: multiRoomProject.paintedCount,
    totalCount: multiRoomProject.totalCount,
    createdAt: multiRoomProject.createdAt,
    photos: multiRoomProject.photos.map(p => ({
      order: p.order,
      originalUrl: p.originalUrl,
      paintedUrl: p.paintedUrl,
      status: p.status,
    })),
  });
}
