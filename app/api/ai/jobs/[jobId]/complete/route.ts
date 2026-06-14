/**
 * POST /api/ai/jobs/[jobId]/complete
 *
 * Called by the worker after uploading all 8 mask outputs to Drive.
 *
 * Body: { workerId: string, outputs: Record<string, { driveFileId, fileName }> }
 *
 * Verifies workerId, sets status: 'completed', saves outputs + completedAt.
 * Does NOT compute the Vastu analysis here — that runs lazily in the status route.
 *
 * Requires X-Worker-Secret header.
 */

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import GpuJob from '@/lib/db/models/GpuJob';

export const runtime = 'nodejs';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const workerSecret = process.env.WORKER_SECRET;
  if (!workerSecret || request.headers.get('x-worker-secret') !== workerSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const { jobId } = await params;

  let body: any;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { workerId, outputs } = body;
  if (!workerId) {
    return NextResponse.json({ error: 'workerId is required' }, { status: 400 });
  }

  const job = await GpuJob.findOneAndUpdate(
    {
      _id: jobId,
      'lease.workerId': workerId,
      status: { $in: ['leased', 'processing'] },
    },
    {
      $set: {
        status: 'completed',
        outputs: outputs ?? {},
        completedAt: new Date(),
      },
    },
    { new: true },
  );

  if (!job) {
    return NextResponse.json(
      { error: 'Job not found or workerId mismatch' },
      { status: 404 },
    );
  }

  console.log(`[Jobs/Complete] Job ${jobId} completed by worker ${workerId}`);
  return NextResponse.json({ ok: true, status: job.status });
}
