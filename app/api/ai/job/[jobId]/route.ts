/**
 * GET /api/ai/job/[jobId]
 *
 * Generic async job status poll endpoint.
 * Frontend polls this every 3 s after POST /api/ai/[feature] returns a jobId.
 *
 * Returns:
 *   { jobId, status, resultUrl?, error?, createdAt, updatedAt }
 *
 * status values: 'queued' | 'processing' | 'done' | 'failed'
 * Only the job owner can poll their own job.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getJob } from '@/lib/redis/aiQueue';
import { getCurrentUser } from '@/lib/auth/jwt';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { jobId } = await params;
  const job = await getJob(jobId);

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  if (job.userId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({
    jobId:     job.jobId,
    status:    job.status,
    resultUrl: job.resultUrl ?? null,
    error:     job.error     ?? null,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  });
}
