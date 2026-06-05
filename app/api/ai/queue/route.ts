/**
 * GET  /api/ai/queue?jobId={jobId}   — poll job status
 * DELETE /api/ai/queue?jobId={jobId} — cancel a queued job
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/jwt';
import connectToDatabase from '@/lib/db/mongodb';
import { Render } from '@/lib/db/models/Render';
import {
  getQueueStatus,
  getQueueDepth,
  cancelJob,
} from '@/lib/redis/aiQueue';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jobId = request.nextUrl.searchParams.get('jobId');
    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    }

    await connectToDatabase();

    // Ownership check
    const render = await Render.findOne({ jobId }).lean() as any;
    if (!render) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    if (render.userId?.toString() !== authUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Live Redis queue state
    let redisStatus = null;
    try {
      redisStatus = await getQueueStatus(jobId);
    } catch {
      // Redis unavailable — fall back to MongoDB state only
    }

    const depth = await getQueueDepth().catch(() => 0);

    return NextResponse.json({
      jobId,
      renderId: render._id.toString(),
      jobStatus:           render.jobStatus,
      queuePosition:       redisStatus?.position ?? render.queuePosition ?? null,
      estimatedWaitSeconds: redisStatus?.estimatedWaitSeconds ?? render.estimatedWaitSeconds ?? null,
      featureType:         render.featureType,
      queuedAt:            render.queuedAt,
      processingStartedAt: render.processingStartedAt,
      completedAt:         render.completedAt,
      imageUrl:            render.outputImage ?? render.resultUrl ?? null,
      queueDepth:          depth,
    });
  } catch (err: any) {
    console.error('[queue GET]', err.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jobId = request.nextUrl.searchParams.get('jobId');
    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    }

    await connectToDatabase();

    const render = await Render.findOne({ jobId }).lean() as any;
    if (!render) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    if (render.userId?.toString() !== authUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Only cancel if still queued
    const cancelled = await cancelJob(jobId).catch(() => false);

    if (cancelled) {
      await Render.findOneAndUpdate({ jobId }, { jobStatus: 'cancelled' });
      return NextResponse.json({ success: true, message: 'Job cancelled.' });
    }

    return NextResponse.json(
      { success: false, message: 'Job is already processing and cannot be cancelled.' },
      { status: 409 }
    );
  } catch (err: any) {
    console.error('[queue DELETE]', err.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
