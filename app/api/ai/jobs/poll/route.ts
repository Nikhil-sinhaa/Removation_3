/**
 * POST /api/ai/jobs/poll
 *
 * Called by the GPU worker daemon to atomically lease a pending job.
 *
 * Security: requires the X-Worker-Secret header to match WORKER_SECRET env var.
 *
 * Returns:
 *   { jobId, workflowType, inputs, params }  — job leased
 *   { jobId: null }                           — no job available
 *
 * Lease is valid for 5 minutes. Worker must heartbeat to extend.
 * Jobs with expired leases (lease.expiresAt < now and status: 'leased'/'processing')
 * are treated as pending so another worker can re-claim them.
 */

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import GpuJob from '@/lib/db/models/GpuJob';

export const runtime = 'nodejs';

const LEASE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export async function POST(request: Request) {
  // ── Shared-secret guard ───────────────────────────────────────────────────
  const workerSecret = process.env.WORKER_SECRET;
  if (!workerSecret) {
    return NextResponse.json({ error: 'WORKER_SECRET not configured' }, { status: 500 });
  }
  const headerSecret = request.headers.get('x-worker-secret');
  if (headerSecret !== workerSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { workerId } = body;
  if (!workerId) {
    return NextResponse.json({ error: 'workerId is required' }, { status: 400 });
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + LEASE_DURATION_MS);

  // Atomic lease — find a job that is:
  //   (a) status === 'pending', OR
  //   (b) status in ['leased','processing'] AND lease.expiresAt < now (stale)
  // Sort by queuedAt ASC (FIFO).
  const job = await GpuJob.findOneAndUpdate(
    {
      $or: [
        { status: 'pending' },
        {
          status: { $in: ['leased', 'processing'] },
          'lease.expiresAt': { $lt: now },
        },
      ],
    },
    {
      $set: {
        status: 'leased',
        lease: { workerId, leasedAt: now, expiresAt },
      },
    },
    {
      sort: { queuedAt: 1 },
      new: true,
    },
  );

  if (!job) {
    return NextResponse.json({ jobId: null });
  }

  console.log(`[Jobs/Poll] Worker ${workerId} leased job ${job._id}`);

  return NextResponse.json({
    jobId: job._id.toString(),
    workflowType: job.workflowType,
    inputs: job.inputs,
    params: job.params,
  });
}
