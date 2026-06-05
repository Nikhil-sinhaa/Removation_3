import { NextResponse } from 'next/server';
import FloorPlanProject from '@/src/models/FloorPlanProject';
import { connectDB } from '@/lib/db/mongodb';
import { getCurrentUser } from '@/lib/auth/jwt';

export async function GET(req, { params }) {
  const authUser = await getCurrentUser();
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  
  const { projectId } = params;
  const project = await FloorPlanProject.findById(projectId);
  
  if (!project || project.userId !== authUser.id) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  
  return NextResponse.json({
    projectId: project._id,
    roomName: project.roomName,
    status: project.status,
    photoCount: project.photos.length,
    photos: project.photos.map(p => ({
      url: p.originalUrl,
      order: p.order,
    })),
    pointCloud: project.status === 'point_cloud_ready' ? {
      pointCount: project.pointCloud.pointCount,
      boundingBox: project.pointCloud.boundingBox,
      cameraCount: project.pointCloud.cameraPositions?.length,
      generatedAt: project.pointCloud.generatedAt,
    } : null,
    errorMessage: project.errorMessage,
    processingLog: project.processingLog,
    createdAt: project.createdAt,
  });
}
