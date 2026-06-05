import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis/client';
import { forceReleaseStuckLock } from '@/lib/redis/aiQueue';

export const dynamic = 'force-dynamic';

/**
 * POST /api/test/queue/flush
 * Releases the worker mutex and wipes the job list.
 * Returns: { flushed: true }
 * Blocked in production.
 */
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }

  const secret = req.headers.get('x-test-secret');
  if (secret !== (process.env.TEST_SECRET || 'test_secret_local')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await forceReleaseStuckLock();
  const redis = getRedisClient();
  await redis.del('ai_queue:jobs');

  return NextResponse.json({ flushed: true });
}
