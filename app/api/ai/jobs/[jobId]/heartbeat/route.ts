/**
 * POST /api/ai/jobs/[jobId]/heartbeat
 *
 * Extends the worker lease by 5 minutes.
 * Worker should call this every ~30 s while ComfyUI is running.
 *
 * Requires X-Worker-Secret header.
 * Only extends if workerId matches and status is 'leased' or 'processing'.
 */

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import GpuJob from '@/lib/db/models/GpuJob';

export const runtime = 'nodejs';

const LEASE_EXTENSION_MS = 5 * 60 * 1000;

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

  const { workerId } = body;
  if (!workerId) {
    return NextResponse.json({ error: 'workerId is required' }, { status: 400 });
  }

  const newExpiry = new Date(Date.now() + LEASE_EXTENSION_MS);

  const job = await GpuJob.findOneAndUpdate(
    {
      _id: jobId,
      'lease.workerId': workerId,
      status: { $in: ['leased', 'processing'] },
    },
    { $set: { 'lease.expiresAt': newExpiry } },
    { new: true },
  );

  if (!job) {
    return NextResponse.json(
      { error: 'Job not found or workerId mismatch' },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, expiresAt: newExpiry });
}
