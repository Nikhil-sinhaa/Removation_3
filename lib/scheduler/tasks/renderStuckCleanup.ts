import { TaskResult } from '../engine';
import { connectToDatabase } from '@/lib/db/mongodb';

export async function renderStuckCleanupTask(): Promise<TaskResult> {
  await connectToDatabase();

  const Render = (await import('@/lib/db/models/Render')).Render;

  // ── 1. Existing: mark old processing renders (legacy status field) ──────────
  const cutoff = new Date();
  cutoff.setMinutes(cutoff.getMinutes() - 30);

  const result = await Render.updateMany(
    {
      status:    'processing',
      createdAt: { $lt: cutoff },
    },
    {
      $set: {
        status: 'failed',
        error:  'Timed out — marked as failed by scheduler',
      },
    }
  );

  // ── 2. Queue-aware: release stale Redis lock ─────────────────────────────────
  let lockReleased = false;
  let stuckQueueCount = 0;

  try {
    const { getRedisClient } = await import('@/lib/redis/client');
    const { forceReleaseStuckLock, cancelJob } = await import('@/lib/redis/aiQueue');

    const redis = getRedisClient();
    const processingJobId = await redis.get('ai_queue:processing');

    if (processingJobId) {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const staleRender = await Render.findOne({ jobId: processingJobId });

      const isStale =
        !staleRender ||
        staleRender.jobStatus === 'completed' ||
        staleRender.jobStatus === 'failed' ||
        (staleRender.processingStartedAt != null &&
         staleRender.processingStartedAt < tenMinutesAgo);

      if (isStale) {
        await forceReleaseStuckLock();
        lockReleased = true;
        console.log(`[StuckCleanup] Released stale lock for job ${processingJobId}`);
      }
    }

    // ── 3. Find renders stuck in queued/processing > 15 min ───────────────────
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const stuckRenders = await Render.find({
      jobStatus: { $in: ['queued', 'processing'] },
      queuedAt:  { $lt: fifteenMinutesAgo },
    }).lean();

    for (const render of stuckRenders) {
      await Render.findByIdAndUpdate(render._id, {
        jobStatus: 'failed',
        completedAt: new Date(),
      });

      if (render.jobId) {
        try { await cancelJob(render.jobId); } catch (_) { /* already gone */ }
      }

      // TODO: refund credits to user when a refundCredits() helper is available
      console.log(
        `[StuckCleanup] Render ${render._id} stuck > 15 min — marked failed.` +
        ` TODO: refund credits to user ${String(render.userId)}`
      );
    }

    stuckQueueCount = stuckRenders.length;
  } catch (redisErr: any) {
    console.warn('[StuckCleanup] Redis step skipped (Redis unavailable):', redisErr.message);
  }

  return {
    success: true,
    message:
      `Legacy: ${result.modifiedCount} stuck renders marked failed. ` +
      `Queue: ${stuckQueueCount} queue renders failed, lock released: ${lockReleased}`,
    details: {
      legacyModifiedCount: result.modifiedCount,
      stuckQueueCount,
      lockReleased,
    },
  };
}
