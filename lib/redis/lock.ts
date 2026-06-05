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
