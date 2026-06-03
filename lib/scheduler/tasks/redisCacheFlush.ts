import { TaskResult } from '../engine';

export async function redisCacheFlushTask(): Promise<TaskResult> {
  try {
    const { getRedisClient } = await import('@/lib/redis/client');
    const client = getRedisClient();

    // Scan and delete cache:* keys (admin config cache, app mode cache, etc.)
    let cursor = '0';
    let deleted = 0;
    do {
      const [nextCursor, keys] = await client.scan(cursor, 'MATCH', 'cache:*', 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) {
        await client.del(...keys);
        deleted += keys.length;
      }
    } while (cursor !== '0');

    return {
      success: true,
      message: `Flushed ${deleted} expired cache keys`,
      details: { deleted },
    };
  } catch (err) {
    return {
      success: false,
      message: `Redis cache flush failed: ${String(err)}`,
    };
  }
}
