import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { getCurrentUser } from '@/lib/auth/jwt';
import Snapshot from '@/lib/db/models/Snapshot';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string; snapshotId: string }>;
}

/**
 * GET /api/projects/[id]/snapshots/[snapshotId]
 * Get a specific snapshot for preview.
 */
export async function GET(req: NextRequest, { params }: RouteContext) {
  const authUser = await getCurrentUser();
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const { id, snapshotId } = await params;

  const snapshot = await Snapshot.findOne({
    _id:       new mongoose.Types.ObjectId(snapshotId),
    projectId: new mongoose.Types.ObjectId(id),
    userId:    new mongoose.Types.ObjectId(authUser.id),
  }).lean();

  if (!snapshot) return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 });

  return NextResponse.json({ snapshot });
}

/**
 * PATCH /api/projects/[id]/snapshots/[snapshotId]
 * Toggle pin or rename a snapshot.
 */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const authUser = await getCurrentUser();
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const { id, snapshotId } = await params;
  const body = await req.json();

  const update: Record<string, unknown> = {};
  if (typeof body.isPinned === 'boolean') update.isPinned = body.isPinned;
  if (typeof body.label   === 'string')  update.label    = body.label;

  const snapshot = await Snapshot.findOneAndUpdate(
    {
      _id:       new mongoose.Types.ObjectId(snapshotId),
      projectId: new mongoose.Types.ObjectId(id),
      userId:    new mongoose.Types.ObjectId(authUser.id),
    },
    update,
    { new: true }
  );

  if (!snapshot) return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 });

  return NextResponse.json({ success: true, snapshot });
}

/**
 * DELETE /api/projects/[id]/snapshots/[snapshotId]
 * Delete a snapshot. Pinned snapshots cannot be deleted this way.
 */
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const authUser = await getCurrentUser();
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const { id, snapshotId } = await params;

  const snapshot = await Snapshot.findOneAndDelete({
    _id:       new mongoose.Types.ObjectId(snapshotId),
    projectId: new mongoose.Types.ObjectId(id),
    userId:    new mongoose.Types.ObjectId(authUser.id),
    isPinned:  false,
  });

  if (!snapshot) {
    return NextResponse.json(
      { error: 'Snapshot not found or is pinned' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
