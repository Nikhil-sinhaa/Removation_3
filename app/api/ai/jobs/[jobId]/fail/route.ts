/**
 * POST /api/ai/jobs/[jobId]/fail
 *
 * Called by the worker on error.
 *
 * Body: { workerId: string, error: string }
 *
 * Appends to errorLogs.
 * If retries remain (retryCount < maxRetries): re-queues (status → 'pending', clears lease).
 * Otherwise: status → 'failed'.
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

  const { workerId, error: errorMsg } = body;
  if (!workerId) {
    return NextResponse.json({ error: 'workerId is required' }, { status: 400 });
  }

  // Verify ownership
  const existing = await GpuJob.findOne({
    _id: jobId,
    'lease.workerId': workerId,
    status: { $in: ['leased', 'processing'] },
  });

  if (!existing) {
    return NextResponse.json(
      { error: 'Job not found or workerId mismatch' },
      { status: 404 },
    );
  }

  const newRetryCount = existing.retryCount + 1;
  const retriesExhausted = newRetryCount > existing.maxRetries;

  const update: Record<string, unknown> = {
    $inc: { retryCount: 1 },
    $push: { errorLogs: `[${new Date().toISOString()}] ${errorMsg ?? 'Unknown error'}` },
  };

  if (retriesExhausted) {
    (update.$set as Record<string, unknown>) = {
      status: 'failed',
      failedAt: new Date(),
      lease: undefined,
    };
  } else {
    // Re-queue: clear lease, reset to pending
    (update.$set as Record<string, unknown>) = {
      status: 'pending',
      lease: undefined,
    };
  }

  await GpuJob.updateOne({ _id: jobId }, update);

  const finalStatus = retriesExhausted ? 'failed' : 'pending';
  console.log(
    `[Jobs/Fail] Job ${jobId} by worker ${workerId}: ` +
    `retry ${newRetryCount}/${existing.maxRetries} → ${finalStatus}`,
  );

  return NextResponse.json({ ok: true, status: finalStatus, retryCount: newRetryCount });
}
