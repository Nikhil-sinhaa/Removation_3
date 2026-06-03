import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { getCurrentUser } from '@/lib/auth/jwt';
import { createSnapshot, getProjectSnapshots, extractProjectData } from '@/lib/versioning/snapshots';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/projects/[id]/snapshots
 * Returns all snapshots for the project, newest first.
 */
export async function GET(req: NextRequest, { params }: RouteContext) {
  const authUser = await getCurrentUser();
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  const snapshots = await getProjectSnapshots(id, authUser.id, 50);
  return NextResponse.json({ snapshots });
}

/**
 * POST /api/projects/[id]/snapshots
 * Manually create a snapshot of the current project state.
 * Body: { trigger?, label?, thumbnailUrl?, isPinned? }
 */
export async function POST(req: NextRequest, { params }: RouteContext) {
  const authUser = await getCurrentUser();
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const ProjectModel = mongoose.models['Project'];
  if (!ProjectModel) {
    return NextResponse.json({ error: 'Project model not found' }, { status: 500 });
  }

  const project = await ProjectModel.findOne({
    _id:    new mongoose.Types.ObjectId(id),
    userId: new mongoose.Types.ObjectId(authUser.id),
  }).lean();

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const projectData = extractProjectData(project as Record<string, unknown>);
  if (body.thumbnailUrl) projectData.thumbnailUrl = body.thumbnailUrl;

  const snapshotId = await createSnapshot({
    projectId:    id,
    userId:       authUser.id,
    trigger:      body.trigger || 'manual_save',
    label:        body.label,
    data:         projectData,
    thumbnailUrl: body.thumbnailUrl,
    isPinned:     body.isPinned || false,
  });

  return NextResponse.json({ success: true, snapshotId });
}
