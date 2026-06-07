import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis/client';
import { requireRole } from '@/lib/auth/requireRole';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authResult = await requireRole(req, ['admin']);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const client = getRedisClient();
    const start = Date.now();
    await client.ping();
    const latencyMs = Date.now() - start;
    const info = await client.info('memory');
    const usedMemory = info.match(/used_memory_human:(.+)/)?.[1]?.trim() ?? 'unknown';

    return NextResponse.json({
      status: 'connected',
      latencyMs,
      usedMemory,
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: process.env.REDIS_PORT || '6379',
      tls: process.env.REDIS_TLS === 'true',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { status: 'disconnected', error: message },
      { status: 503 }
    );
  }
}
