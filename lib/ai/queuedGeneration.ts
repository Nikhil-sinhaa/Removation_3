/**
 * lib/ai/queuedGeneration.ts
 *
 * Thin wrapper called by AI route handlers to enqueue a generation job.
 * Returns immediately with queue position — does NOT wait for ComfyUI.
 *
 * Redis fallback: if Redis is unavailable, generateFn() runs synchronously
 * so the app degrades gracefully without breaking the user flow.
 */

import { enqueueJob, getQueueDepth } from '@/lib/redis/aiQueue';
import { JobFunctionRegistry } from '@/lib/ai/JobFunctionRegistry';
import connectToDatabase from '@/lib/db/mongodb';
import { Render } from '@/lib/db/models/Render';
import mongoose from 'mongoose';
import { User } from '@/lib/db/models/User';
import { getAppMode, getCreditCosts } from '@/lib/ai/appMode';

export const FEATURE_DURATIONS: Record<string, number> = {
  'room-changer':        45,
  'style-transfer':      60,
  'lighting':            50,
  'furniture-remover':   40,
  'furniture-placement': 55,
  'ceiling-changer':     45,
  'interior-render':     70,
  'exterior-render':     70,
  'empty-room':          40,
  'furnish':             55,
  'recolor':             50,
  'redesign':            65,
  'remove-object':       45,
};

function calcEstimatedWait(featureType: string, queueDepth: number): number {
  const perJob = FEATURE_DURATIONS[featureType] ?? 60;
  // Rough estimate: depth × average job duration
  return queueDepth * 55 + perJob;
}

export interface EnqueueResult {
  jobId: string;
  renderId: string;
  queuePosition: number;
  estimatedWaitSeconds: number;
  message: string;
}

/**
 * Enqueue a generation job.
 * @param generateFn  The closure that calls the orchestrator. Must resolve when done.
 */
export async function enqueueGeneration(params: {
  userId: string;
  featureType: string;
  generateFn: () => Promise<void>;
}): Promise<EnqueueResult> {
  const { userId, featureType, generateFn } = params;

  try {
    await connectToDatabase();

    // Enforce queue depth cap
    const depth = await getQueueDepth();
    if (depth >= 10) {
      const err = new Error('Queue is full. Please try again in a few minutes.');
      (err as any).code = 'QUEUE_FULL';
      throw err;
    }

    // Credit pre-flight check
    const appMode = await getAppMode();
    if (appMode === 'production') {
      let user = await User.findOne({ clerkId: userId }).lean();
      if (!user && mongoose.Types.ObjectId.isValid(userId)) {
        user = await User.findById(userId).lean();
      }

      const isOnboardingBypass = user?.onboardingCompleted === false;
      if (!isOnboardingBypass) {
        const DEFAULT_TOOL_COSTS: Record<string, number> = {
          'auto-edit': 1,
          'background': 1,
          'ceiling-changer': 1,
          'collage': 1,
          'edit': 1,
          'recolor': 1,
          'segment': 1,
          'remove-object': 1,
          'lineart': 1,
          'postprocess': 1,
          'view-extend': 1,
          'furniture-placement/generate': 2,
          'furnish': 2,
          'empty-room': 2,
          'landscape': 2,
          'lighting': 2,
          'style-transfer': 2,
          'render': 2,
          'interior-render': 3,
          'exterior-render': 3,
          'ultra-pro': 3,
          'redesign': 3,
          'furniture-placement/remove-bg': 0
        };
        const creditCosts = await getCreditCosts();
        const cost = creditCosts[featureType] ?? DEFAULT_TOOL_COSTS[featureType] ?? 1;

        const remaining = user?.subscription 
          ? (user.subscription.credits - user.subscription.creditsUsed) 
          : (user?.credits ?? 0);

        if (!user || remaining < cost) {
          throw Object.assign(
            new Error('insufficient_credits: Insufficient credits'),
            { code: 'insufficient_credits' }
          );
        }
      }
    }

    // Create a Render document as the queue tracking record
    const render = await Render.create({
      userId,
      inputImage: 'queue-tracking',  // placeholder — required field
      mode: 'redesign',              // placeholder — required field
      status: 'queued',
      featureType,
      jobStatus: 'queued',
      queuedAt: new Date(),
      estimatedWaitSeconds: calcEstimatedWait(featureType, depth),
    });

    const renderId = render._id.toString();
    const jobId = `job_${renderId}_${Date.now()}`;

    // Register the generate function before enqueuing
    JobFunctionRegistry.register(jobId, generateFn);

    const { position } = await enqueueJob({ jobId, renderId, userId, featureType });

    // Update Render with jobId and position
    await Render.findByIdAndUpdate(render._id, {
      jobId,
      queuePosition: position,
      estimatedWaitSeconds: calcEstimatedWait(featureType, position - 1),
    });

    return {
      jobId,
      renderId,
      queuePosition: position,
      estimatedWaitSeconds: calcEstimatedWait(featureType, position - 1),
      message: 'Your generation has been queued.',
    };
  } catch (err: any) {
    // ── Redis fallback — run synchronously if queue is unavailable ─────────
    if (
      err.message?.includes('ECONNREFUSED') ||
      err.message?.includes('Redis') ||
      err.message?.includes('connect')
    ) {
      console.error('[Queue] Redis unavailable, running synchronously:', err.message);

      let renderId = 'sync';
      try {
        await connectToDatabase();
        const render = await Render.create({
          userId,
          inputImage: 'queue-tracking',
          mode: 'redesign',
          status: 'queued',
          featureType,
          jobStatus: 'processing',
          queuedAt: new Date(),
          processingStartedAt: new Date(),
        });
        renderId = render._id.toString();
      } catch {
        // DB also unavailable — proceed anyway
      }

      const syncJobId = `sync_${Date.now()}`;

      // Run fire-and-forget; caller already handles its own error logging
      generateFn().then(async () => {
        try {
          if (renderId !== 'sync') {
            await Render.findByIdAndUpdate(renderId, {
              jobStatus: 'completed',
              completedAt: new Date(),
            });
          }
        } catch {}
      }).catch(async (runErr: any) => {
        console.error('[Queue] Sync fallback generateFn failed:', runErr.message);
        try {
          if (renderId !== 'sync') {
            await Render.findByIdAndUpdate(renderId, { jobStatus: 'failed' });
          }
        } catch {}
      });

      return {
        jobId: syncJobId,
        renderId,
        queuePosition: 0,
        estimatedWaitSeconds: 0,
        message: 'Generated synchronously (queue unavailable).',
      };
    }

    // Re-throw non-Redis errors (e.g. queue full)
    throw err;
  }
}
