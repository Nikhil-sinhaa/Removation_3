import { NextResponse } from 'next/server';
import MultiRoomProject from '@/src/models/MultiRoomProject';
import { connectDB } from '@/src/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  await connectDB();

  const resolvedParams = await params;
  const projectId = resolvedParams.projectId;

  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
  }

  const project = await MultiRoomProject.findById(projectId);

  if (!project) {
    return NextResponse.json(
      { error: 'Project not found' },
      { status: 404 }
    );
  }

  // Marble API does not support cancelling an in-progress
  // operation — but we can mark it cancelled on our side
  // so the polling loop stops and UI resets

  await MultiRoomProject.findByIdAndUpdate(projectId, {
    marbleStatus: 'cancelled',
    errorMessage: 'Cancelled by user',
  });

  return NextResponse.json({ success: true });
}
