/**
 * GET  /api/admin/queue  — queue stats + job list (admin only)
 * POST /api/admin/queue  — admin actions: flush_stuck_lock | clear_queue
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import {
  getQueueStats,
  listQueuedJobIds,
  getJobMeta,
  forceReleaseStuckLock,
  cancelJob,
} from '@/lib/redis/aiQueue';
import { JobFunctionRegistry } from '@/lib/ai/JobFunctionRegistry';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authResult = await requireRole(req, ['admin']);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectToDatabase();
    const { Render } = await import('@/lib/db/models/Render');

    const [stats, queuedIds, recentCompleted] = await Promise.all([
      getQueueStats().catch(() => ({
        queueDepth: 0,
        currentlyProcessing: null,
        totalQueued: 0,
        totalCompleted: 0,
        totalFailed: 0,
      })),
      listQueuedJobIds().catch(() => [] as string[]),
      Render.find({ jobStatus: { $in: ['completed', 'failed'] } })
        .sort({ completedAt: -1 })
        .limit(10)
        .select('featureType jobStatus processingStartedAt completedAt queuedAt')
        .lean(),
    ]);

    const queuedJobs = await Promise.all(
      queuedIds.map(async (id, index) => {
        const meta = await getJobMeta(id).catch(() => null);
        return {
          position: index + 1,
          jobId: id,
          featureType: meta?.featureType ?? 'unknown',
          queuedAt: meta?.queuedAt ?? null,
          estimatedDurationSeconds: meta?.estimatedDurationSeconds ?? 60,
        };
      })
    );

    const recentJobs = recentCompleted.map((r: any) => {
      const durationSeconds =
        r.processingStartedAt && r.completedAt
          ? Math.round((new Date(r.completedAt).getTime() - new Date(r.processingStartedAt).getTime()) / 1000)
          : null;
      return {
        featureType: r.featureType,
        jobStatus: r.jobStatus,
        durationSeconds,
        completedAt: r.completedAt,
        queuedAt: r.queuedAt,
      };
    });

    return NextResponse.json({
      stats,
      queuedJobs,
      recentJobs,
      registrySize: JobFunctionRegistry.size(),
    });
  } catch (err: any) {
    console.error('[admin/queue GET]', err.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireRole(req, ['admin']);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { action } = await req.json();

    if (action === 'flush_stuck_lock') {
      await forceReleaseStuckLock();
      return NextResponse.json({ success: true, message: 'Lock released.' });
    }

    if (action === 'clear_queue') {
      await connectToDatabase();
      const { Render } = await import('@/lib/db/models/Render');

      const ids = await listQueuedJobIds().catch(() => [] as string[]);
      for (const id of ids) {
        try { await cancelJob(id); } catch (_) {}
      }

      const updateResult = await Render.updateMany(
        { jobStatus: 'queued' },
        { $set: { jobStatus: 'failed', completedAt: new Date() } }
      );

      return NextResponse.json({
        success: true,
        cancelledCount: ids.length,
        rendersMarkedFailed: updateResult.modifiedCount,
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('[admin/queue POST]', err.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
