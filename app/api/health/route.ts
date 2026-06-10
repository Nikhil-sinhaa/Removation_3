import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { getRedisClient } from '@/lib/redis/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const services: Record<string, 'ok' | 'error'> = {
    database: 'error',
    redis: 'error',
  };

  await Promise.all([
    connectToDatabase()
      .then(() => { services.database = 'ok'; })
      .catch(() => {}),

    (async () => {
      try {
        const redis = getRedisClient();
        await Promise.race([
          redis.ping(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
        ]);
        services.redis = 'ok';
      } catch {
        // redis stays 'error'
      }
    })(),
  ]);

  const allOk = Object.values(services).every(s => s === 'ok');

  return NextResponse.json(
    {
      status: allOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services,
    },
    { status: allOk ? 200 : 503 }
  );
}
