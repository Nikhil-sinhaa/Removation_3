import Redlock, { Lock } from 'redlock';
import { getRedisClient } from './client';

let _redlock: Redlock | null = null;

export function getRedlock(): Redlock {
  if (!_redlock) {
    _redlock = new Redlock(
      [getRedisClient()],
      {
        retryCount: 10,
        retryDelay: 200,
        retryJitter: 100,
        automaticExtensionThreshold: 500,
      }
    );

    _redlock.on('error', (err: Error) => {
      if (err.message.includes('LockError') || err.message.includes('Unable to acquire')) {
        console.warn('[Redlock] Could not acquire lock:', err.message);
      } else {
        console.error('[Redlock] Error:', err);
      }
    });
  }
  return _redlock;
}

export async function withLock<T>(
  resource: string,
  ttlMs: number,
  fn: () => Promise<T>
): Promise<T> {
  const redlock = getRedlock();
  const lock = await redlock.acquire([`lock:${resource}`], ttlMs);
  try {
    return await fn();
  } finally {
    await lock.release();
  }
}

// AI render lock — prevents a user from firing duplicate renders simultaneously
export async function acquireRenderLock(userId: string, toolName: string): Promise<Lock> {
  const redlock = getRedlock();
  return redlock.acquire(
    [`lock:render:${userId}:${toolName}`],
    60000 // 60s TTL — max expected render duration
  );
}

let _redlockFast: Redlock | null = null;

function getRedlockFast(): Redlock {
  if (!_redlockFast) {
    _redlockFast = new Redlock([getRedisClient()], {
      retryCount: 0,
      automaticExtensionThreshold: 500,
    });
    _redlockFast.on('error', () => {});
  }
  return _redlockFast;
}

// Fail-fast render lock — returns null immediately if already locked.
// Use before credit deduction + job submission to prevent duplicate renders
// when a user rapidly double-submits. TTL: 30s for fire-and-forget routes,
// 180s for synchronous routes (room-changer, lighting, style-transfer).
export async function tryAcquireRenderLock(
  userId: string,
  toolName: string,
  ttlMs = 30000
): Promise<Lock | null> {
  try {
    return await getRedlockFast().acquire([`lock:render:${userId}:${toolName}`], ttlMs);
  } catch {
    return null;
  }
}
