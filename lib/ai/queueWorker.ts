/**
 * lib/ai/queueWorker.ts
 *
 * Singleton worker that polls the Redis queue and processes one AI generation
 * job at a time, preventing GPU collisions on the RTX 4060.
 *
 * Start via ensureWorkerRunning() from workerInit.ts — never instantiate directly.
 */

import { getNextJob, completeJob, enqueueJob, QueueJob } from '@/lib/redis/aiQueue';
import { JobFunctionRegistry } from '@/lib/ai/JobFunctionRegistry';

// ── Permanent vs transient error classification ───────────────────────────────
// These error codes represent business-logic failures that will never resolve
// by retrying — do not waste credits or queue slots on them.
const PERMANENT_ERROR_CODES = [
  'insufficient_credits',
  'unauthorized',
  'forbidden',
  'validation_error',
  'not_found',
  'generation function expired',
]

function isTransientError(err: unknown): boolean {
  // Use string matching only — never instanceof
  // because cross-realm errors fail instanceof checks
  const msg = String(
    (err as any)?.message ?? (err as any)?.code ?? err ?? ''
  ).toLowerCase()
  return !PERMANENT_ERROR_CODES.some(code => msg.includes(code))
}

// Lazy import to avoid circular deps at module load time
async function getRender() {
  const mod = await import('@/lib/db/models/Render');
  return mod.Render;
}

async function connectDB() {
  const mod = await import('@/lib/db/mongodb');
  // connectDB / connectToDatabase are both used in the codebase
  const fn = (mod as any).connectDB || (mod as any).connectToDatabase || (mod as any).default;
  if (typeof fn === 'function') await fn();
}

export class QueueWorker {
  private static instance: QueueWorker | null = null;
  private isRunning = false;
  private pollIntervalMs = 2000;
  private activeJobId: string | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  static getInstance(): QueueWorker {
    if (!QueueWorker.instance) {
      QueueWorker.instance = new QueueWorker();
    }
    return QueueWorker.instance;
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.schedulePoll();
    console.log('[QueueWorker] Started — polling every', this.pollIntervalMs, 'ms');
  }

  stop(): void {
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    console.log('[QueueWorker] Stopped');
  }

  getActiveJobId(): string | null {
    return this.activeJobId;
  }

  private schedulePoll(): void {
    if (!this.isRunning) return;
    this.timer = setTimeout(async () => {
      try {
        await this.processNextJob();
      } catch (err: any) {
        console.error('[QueueWorker] Unexpected error in poll cycle:', err.message);
      }
      this.schedulePoll();
    }, this.pollIntervalMs);
  }

  private async processNextJob(): Promise<void> {
    let rawJob: QueueJob | null = null;

    try {
      rawJob = await getNextJob();
    } catch (err: any) {
      // Redis unavailable — skip this cycle silently
      return;
    }

    if (!rawJob) return; // queue empty or lock held by another worker
    const job = rawJob;

    this.activeJobId = job.jobId;
    console.log(`[QueueWorker] Processing job ${job.jobId} (${job.featureType})`);

    try {
      await connectDB();
      const Render = await getRender();

      // Update Render document to 'processing'
      await Render.findOneAndUpdate(
        { jobId: job.jobId },
        {
          jobStatus: 'processing',
          processingStartedAt: new Date(),
          queuePosition: null,
        }
      );

      // Dispatch to the registered generate function
      await this.dispatchJob(job);

      // Mark completed in Render
      await Render.findOneAndUpdate(
        { jobId: job.jobId },
        { jobStatus: 'completed', completedAt: new Date() }
      );

      await completeJob(job.jobId, true);
      console.log(`[QueueWorker] Job ${job.jobId} completed`);

      // Fire-and-forget badge evaluation — never await, must not block the queue
      if (job.userId) {
        Promise.resolve().then(async () => {
          try {
            const { evaluateUserBadges } = await import('@/lib/badges/evaluateBadges');
            const { notifyBadgeUnlocked } = await import('@/lib/notifications/send');
            const { newlyUnlocked } = await evaluateUserBadges(job.userId);
            for (const badge of newlyUnlocked) {
              await notifyBadgeUnlocked(job.userId, badge.name).catch(() => {});
            }
          } catch {
            // Swallow — badge evaluation is non-critical
          }
        });
      }
    } catch (err: any) {
      console.error(`[QueueWorker] Job ${job.jobId} failed:`, err.message);

      try {
        await connectDB();
        const Render = await getRender();
        await Render.findOneAndUpdate(
          { jobId: job.jobId },
          { jobStatus: 'failed', completedAt: new Date() }
        );

        // Retry path: only retry transient errors up to maxRetries limit
        if (isTransientError(err) && (job.retryCount ?? 0) < (job.maxRetries ?? 0)) {
          // Strip ALL existing retry suffixes before appending new one
          const baseJobId = job.jobId.replace(/(_retry\d+)+$/, '')
          const newRetryCount = (job.retryCount ?? 0) + 1
          const retryJobId = `${baseJobId}_retry${newRetryCount}`
          const fn = JobFunctionRegistry.get(job.jobId);
          if (fn) {
            JobFunctionRegistry.register(retryJobId, fn);
            await enqueueJob({
              jobId: retryJobId,
              renderId: job.renderId,
              userId: job.userId,
              featureType: job.featureType,
              priority: 'high',
              retryCount: newRetryCount,
              maxRetries: job.maxRetries,
            });
            console.log(`[QueueWorker] Retrying as ${retryJobId}`);
          }
        } else {
          // Permanent failure or retry limit reached — mark failed, no re-enqueue.
          console.log(
            `[QueueWorker] Job ${job.jobId} permanently failed`
          );
        }
      } catch (updateErr: any) {
        console.error('[QueueWorker] Failed to update Render on failure:', updateErr.message);
      }

      try {
        await completeJob(job.jobId, false);
      } catch {
        // Best-effort
      }
    } finally {
      JobFunctionRegistry.delete(job.jobId);
      this.activeJobId = null;
    }
  }

  private async dispatchJob(job: QueueJob): Promise<void> {
    const generateFn = JobFunctionRegistry.get(job.jobId);

    if (!generateFn) {
      // Function expired (server restart or 30-min timeout)
      console.error(`[QueueWorker] No generateFn for job ${job.jobId} — marking failed`);
      throw new Error('Generation function expired. Please try again.');
    }

    await generateFn();
  }
}
