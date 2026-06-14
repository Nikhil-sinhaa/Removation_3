/**
 * lib/redis/aiQueue.ts
 * Redis list-based FIFO queue for AI generation jobs.
 *
 * Key layout:
 *   ai_queue:jobs               — Redis LIST  (right-push enqueue, left-pop dequeue)
 *   ai_queue:job:{jobId}        — Redis HASH  (job metadata, TTL 24 h)
 *   ai_queue:processing         — Redis STRING (jobId currently being processed, TTL 10 min)
 *   ai_queue:lock               — Redis STRING (worker mutex, TTL 5 min, NX)
 *   ai_queue:stats              — Redis HASH  (total_queued / total_completed / total_failed)
 *
 * NOTE: This replaces the previous stub that only stored job metadata.
 * The canonical implementation is here; src/services/aiQueue.ts is an
 * older in-memory stub kept for backward compat with legacy routes.
 */

import { getRedisClient } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface QueueJob {
  jobId: string;
  renderId: string;
  userId: string;
  featureType: string;
  priority: 'normal' | 'high';
  queuedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  estimatedDurationSeconds: number;
  retryCount: number;
  maxRetries: number;
}

export interface QueueStatus {
  jobId: string;
  status: 'queued' | 'processing' | 'not_found';
  position: number | null;
  estimatedWaitSeconds: number | null;
  queueDepth: number;
}

export interface QueueStats {
  queueDepth: number;
  currentlyProcessing: string | null;
  totalQueued: number;
  totalCompleted: number;
  totalFailed: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const KEYS = {
  jobs:        'ai_queue:jobs',
  job:         (id: string) => `ai_queue:job:${id}`,
  processing:  'ai_queue:processing',
  lock:        'ai_queue:lock',
  stats:       'ai_queue:stats',
} as const;

const JOB_TTL      = 24 * 60 * 60; // 24 h
const LOCK_TTL     = 5  * 60;      // 5 min
const PROCESS_TTL  = 10 * 60;      // 10 min
const DONE_TTL     = 60 * 60;      // 1 h — cleanup after completion

// ─── Helpers ─────────────────────────────────────────────────────────────────

function estimatedDuration(featureType: string): number {
  const map: Record<string, number> = {
    'room-changer':       45,
    'style-transfer':     60,
    'lighting':           50,
    'furniture-remover':  40,
    'furniture-placement': 55,
    'ceiling-changer':    45,
    'interior-render':    70,
    'exterior-render':    70,
    'empty-room':         40,
    'furnish':            55,
    'recolor':            50,
    'redesign':           65,
    'remove-object':      45,
  };
  return map[featureType] ?? 60;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Add a new job to the queue.
 * Returns the assigned jobId and 1-indexed queue position.
 */
export async function enqueueJob(params: {
  jobId: string;
  renderId: string;
  userId: string;
  featureType: string;
  priority?: 'normal' | 'high';
  retryCount?: number;
  maxRetries?: number;
}): Promise<{ jobId: string; position: number }> {
  const redis = getRedisClient();
  const { jobId, renderId, userId, featureType, priority = 'normal', retryCount = 0, maxRetries = 0 } = params;

  const job: QueueJob = {
    jobId,
    renderId,
    userId,
    featureType,
    priority,
    queuedAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
    estimatedDurationSeconds: estimatedDuration(featureType),
    retryCount,
    maxRetries,
  };

  const pipe = redis.pipeline();

  // Store metadata hash
  const jobKey = KEYS.job(jobId);
  for (const [k, v] of Object.entries(job)) {
    if (v !== null) pipe.hset(jobKey, k, String(v));
  }
  pipe.expire(jobKey, JOB_TTL);

  // Push to list
  if (priority === 'high') {
    pipe.lpush(KEYS.jobs, jobId); // front
  } else {
    pipe.rpush(KEYS.jobs, jobId); // back
  }

  pipe.hincrby(KEYS.stats, 'total_queued', 1);
  await pipe.exec();

  // Get position (0-indexed lpos → 1-indexed for display)
  const pos = await redis.lpos(KEYS.jobs, jobId);
  const position = pos !== null ? pos + 1 : 1;

  return { jobId, position };
}

/**
 * Returns live queue status for a given jobId.
 * Returns null if the job is not found (completed or expired).
 */
export async function getQueueStatus(jobId: string): Promise<QueueStatus | null> {
  const redis = getRedisClient();

  // Check if it's the currently processing job
  const processingId = await redis.get(KEYS.processing);
  if (processingId === jobId) {
    const depth = await redis.llen(KEYS.jobs);
    return { jobId, status: 'processing', position: null, estimatedWaitSeconds: null, queueDepth: depth };
  }

  // Check queue position
  const pos = await redis.lpos(KEYS.jobs, jobId);
  if (pos === null) return null; // not in queue

  const depth = await redis.llen(KEYS.jobs);

  // Estimate wait: sum estimated durations for all jobs ahead
  let waitSecs = 0;

  if (processingId) {
    const currentMeta = await redis.hgetall(KEYS.job(processingId));
    waitSecs += parseInt(currentMeta?.estimatedDurationSeconds || '60', 10);
  }

  if (pos > 0) {
    const ahead = await redis.lrange(KEYS.jobs, 0, pos - 1);
    for (const aheadId of ahead) {
      const meta = await redis.hgetall(KEYS.job(aheadId));
      waitSecs += parseInt(meta?.estimatedDurationSeconds || '60', 10);
    }
  }

  return { jobId, status: 'queued', position: pos + 1, estimatedWaitSeconds: waitSecs, queueDepth: depth };
}

/**
 * Pop the next job from the queue and claim the worker lock.
 * Returns null if queue is empty or another worker is already running.
 */
export async function getNextJob(): Promise<QueueJob | null> {
  const redis = getRedisClient();

  // Acquire mutex (NX = only set if not exists)
  const locked = await redis.set(KEYS.lock, '1', 'EX', LOCK_TTL, 'NX');
  if (!locked) return null; // another worker is processing

  const jobId = await redis.lpop(KEYS.jobs);
  if (!jobId) {
    // Queue empty — release lock
    await redis.del(KEYS.lock);
    return null;
  }

  // Mark as currently processing
  await redis.set(KEYS.processing, jobId, 'EX', PROCESS_TTL);

  // Update metadata
  const now = new Date().toISOString();
  await redis.hset(KEYS.job(jobId), 'startedAt', now);

  const meta = await redis.hgetall(KEYS.job(jobId));
  if (!meta || !meta.jobId) {
    // Metadata expired — release and skip
    await redis.del(KEYS.processing, KEYS.lock);
    return null;
  }

  return {
    jobId: meta.jobId,
    renderId: meta.renderId,
    userId: meta.userId,
    featureType: meta.featureType,
    priority: (meta.priority as 'normal' | 'high') || 'normal',
    queuedAt: meta.queuedAt,
    startedAt: meta.startedAt,
    completedAt: meta.completedAt || null,
    estimatedDurationSeconds: parseInt(meta.estimatedDurationSeconds || '60', 10),
    retryCount: parseInt(meta.retryCount || '0', 10),
    maxRetries: parseInt(meta.maxRetries || '1', 10),
  };
}

/**
 * Mark a job as done and release the worker lock.
 */
export async function completeJob(jobId: string, success: boolean): Promise<void> {
  const redis = getRedisClient();
  const now = new Date().toISOString();

  const pipe = redis.pipeline();
  pipe.hset(KEYS.job(jobId), 'completedAt', now);
  pipe.expire(KEYS.job(jobId), DONE_TTL);
  pipe.del(KEYS.processing);
  pipe.del(KEYS.lock);
  pipe.hincrby(KEYS.stats, success ? 'total_completed' : 'total_failed', 1);
  await pipe.exec();
}

/**
 * Attempt to remove a job from the queue (only works if not yet processing).
 * Returns true if cancelled, false if already processing.
 */
export async function cancelJob(jobId: string): Promise<boolean> {
  const redis = getRedisClient();
  const removed = await redis.lrem(KEYS.jobs, 1, jobId);
  if (removed > 0) {
    await redis.del(KEYS.job(jobId));
    return true;
  }
  return false;
}

/** How many jobs are waiting in queue. */
export async function getQueueDepth(): Promise<number> {
  const redis = getRedisClient();
  return redis.llen(KEYS.jobs);
}

/** Aggregate queue statistics. */
export async function getQueueStats(): Promise<QueueStats> {
  const redis = getRedisClient();

  const [depth, processingId, stats] = await Promise.all([
    redis.llen(KEYS.jobs),
    redis.get(KEYS.processing),
    redis.hgetall(KEYS.stats),
  ]);

  return {
    queueDepth: depth,
    currentlyProcessing: processingId,
    totalQueued:    parseInt(stats?.total_queued    || '0', 10),
    totalCompleted: parseInt(stats?.total_completed || '0', 10),
    totalFailed:    parseInt(stats?.total_failed    || '0', 10),
  };
}

/** Emergency: release a stuck lock and clear the processing marker. */
export async function forceReleaseStuckLock(): Promise<void> {
  const redis = getRedisClient();
  await redis.del(KEYS.lock, KEYS.processing);
}

/** Get raw job metadata by jobId (for admin/debug). */
export async function getJobMeta(jobId: string): Promise<QueueJob | null> {
  const redis = getRedisClient();
  const meta = await redis.hgetall(KEYS.job(jobId));
  if (!meta || !meta.jobId) return null;
  return {
    jobId: meta.jobId,
    renderId: meta.renderId,
    userId: meta.userId,
    featureType: meta.featureType,
    priority: (meta.priority as 'normal' | 'high') || 'normal',
    queuedAt: meta.queuedAt,
    startedAt: meta.startedAt || null,
    completedAt: meta.completedAt || null,
    estimatedDurationSeconds: parseInt(meta.estimatedDurationSeconds || '60', 10),
    retryCount: parseInt(meta.retryCount || '0', 10),
    maxRetries: parseInt(meta.maxRetries || '1', 10),
  };
}

/** Return all jobIds currently in the queue list (for admin display). */
export async function listQueuedJobIds(): Promise<string[]> {
  const redis = getRedisClient();
  return redis.lrange(KEYS.jobs, 0, 49); // max 50
}

// ─── Async job tracking (Vercel-compatible) ───────────────────────────────────
//
// These functions use a separate key namespace (ai:job:{jobId}) from the queue
// list above (ai_queue:*). They track the full lifecycle including resultUrl and
// error so the frontend can poll without hitting MongoDB on every request.

export interface AIJob {
  jobId: string;
  status: 'queued' | 'processing' | 'done' | 'failed';
  feature: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
  resultUrl?: string;
  error?: string;
  renderId?: string;
}

const AI_JOB_KEY  = (id: string) => `ai:job:${id}`;
const AI_JOB_TTL  = 24 * 60 * 60; // 24 h

/** Create a new async job record in Redis. */
export async function createJob(
  data: Omit<AIJob, 'createdAt' | 'updatedAt'>,
): Promise<AIJob> {
  const redis = getRedisClient();
  const now = Date.now();
  const job: AIJob = { ...data, createdAt: now, updatedAt: now };

  const pipe = redis.pipeline();
  const key = AI_JOB_KEY(job.jobId);
  for (const [k, v] of Object.entries(job)) {
    if (v !== undefined && v !== null) pipe.hset(key, k, String(v));
  }
  pipe.expire(key, AI_JOB_TTL);
  await pipe.exec();

  return job;
}

/** Update fields on an existing async job record. */
export async function updateJob(
  jobId: string,
  update: Partial<AIJob>,
): Promise<void> {
  const redis = getRedisClient();
  const key = AI_JOB_KEY(jobId);
  const patch = { ...update, updatedAt: Date.now() };
  const pipe = redis.pipeline();
  for (const [k, v] of Object.entries(patch)) {
    if (v !== undefined && v !== null) pipe.hset(key, k, String(v));
  }
  await pipe.exec();
}

/** Retrieve an async job record. Returns null if not found or expired. */
export async function getJob(jobId: string): Promise<AIJob | null> {
  const redis = getRedisClient();
  const raw = await redis.hgetall(AI_JOB_KEY(jobId));
  if (!raw || !raw.jobId) return null;
  return {
    jobId:     raw.jobId,
    status:    raw.status as AIJob['status'],
    feature:   raw.feature,
    userId:    raw.userId,
    createdAt: parseInt(raw.createdAt, 10),
    updatedAt: parseInt(raw.updatedAt, 10),
    resultUrl: raw.resultUrl || undefined,
    error:     raw.error     || undefined,
    renderId:  raw.renderId  || undefined,
  };
}
