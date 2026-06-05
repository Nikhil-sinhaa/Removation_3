import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis/client';

export const dynamic = 'force-dynamic';

/**
 * POST /api/test/queue/seed
 * Pushes 10 fake jobIds into ai_queue:jobs so depth reaches the cap.
 * Returns: { seeded: 10 }
 * Blocked in production. No TEST_SECRET required (Redis key is non-sensitive).
 */
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }

  const secret = req.headers.get('x-test-secret');
  if (secret !== (process.env.TEST_SECRET || 'test_secret_local')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const redis = getRedisClient();
  const ts    = Date.now();
  const ids   = Array.from({ length: 10 }, (_, i) => `test_fake_job_${ts}_${i}`);

  const pipe = redis.pipeline();
  for (const id of ids) {
    pipe.rpush('ai_queue:jobs', id);
  }
  await pipe.exec();

  return NextResponse.json({ seeded: 10 });
}
