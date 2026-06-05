import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { getCurrentUser } from '@/lib/auth/jwt';
import { restoreSnapshot } from '@/lib/versioning/snapshots';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string; snapshotId: string }>;
}

/**
 * POST /api/projects/[id]/snapshots/[snapshotId]/restore
 * Restore the project to this snapshot version.
 * Creates a "before restore" safety snapshot first.
 */
export async function POST(req: NextRequest, { params }: RouteContext) {
  const authUser = await getCurrentUser();
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const { id, snapshotId } = await params;

  const restoredData = await restoreSnapshot(snapshotId, id, authUser.id);

  if (!restoredData) {
    return NextResponse.json(
      { error: 'Snapshot not found or restore failed' },
      { status: 404 }
    );
  }

  // Apply the restored data to the project
  const ProjectModel = mongoose.models['Project'];
  if (ProjectModel) {
    await ProjectModel.findOneAndUpdate(
      {
        _id:    new mongoose.Types.ObjectId(id),
        userId: new mongoose.Types.ObjectId(authUser.id),
      },
      { $set: { ...restoredData, updatedAt: new Date(), lastActivity: new Date() } }
    );
  }

  return NextResponse.json({
    success:      true,
    restoredData,
    message:      'Project restored. A backup of the previous state was saved.',
  });
}
