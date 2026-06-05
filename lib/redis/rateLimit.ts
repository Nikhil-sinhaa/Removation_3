import { getRedisClient } from './client';
import { NextRequest, NextResponse } from 'next/server';

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export async function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  try {
    const client = getRedisClient();
    const key = `ratelimit:${options.keyPrefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - options.windowMs;

    // Sliding window using sorted set
    const pipe = client.pipeline();
    pipe.zremrangebyscore(key, 0, windowStart);
    pipe.zadd(key, now, `${now}-${Math.random()}`);
    pipe.zcard(key);
    pipe.pexpire(key, options.windowMs);
    const results = await pipe.exec();

    const count = (results?.[2]?.[1] as number) ?? 0;
    const allowed = count <= options.maxRequests;
    const remaining = Math.max(0, options.maxRequests - count);
    const resetAt = now + options.windowMs;

    return { allowed, remaining, resetAt };
  } catch (err) {
    console.error('[RateLimit] Error (failing open):', err);
    // Fail open — a Redis outage should not block legitimate users
    return { allowed: true, remaining: 0, resetAt: Date.now() };
  }
}

export const rateLimiters = {
  // AI renders: 10 per minute per user
  aiRender: (userId: string) =>
    checkRateLimit(userId, { windowMs: 60_000, maxRequests: 10, keyPrefix: 'ai_render' }),

  // Auth endpoints: 5 per 15 minutes per IP
  auth: (ip: string) =>
    checkRateLimit(ip, { windowMs: 15 * 60_000, maxRequests: 5, keyPrefix: 'auth' }),

  // General API: 100 per minute per user
  api: (userId: string) =>
    checkRateLimit(userId, { windowMs: 60_000, maxRequests: 100, keyPrefix: 'api' }),

  // Booking creation: 3 per hour per user
  booking: (userId: string) =>
    checkRateLimit(userId, { windowMs: 60 * 60_000, maxRequests: 3, keyPrefix: 'booking' }),
};

// Higher-order wrapper for Next.js App Router route handlers
export function withRateLimit(
  handler: (req: NextRequest, ctx: unknown) => Promise<NextResponse>,
  limiterFn: (id: string) => Promise<RateLimitResult>
) {
  return async (req: NextRequest, ctx: unknown): Promise<NextResponse> => {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';

    const result = await limiterFn(ip);

    if (!result.allowed) {
      return NextResponse.json(
        { error: 'Too many requests', retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000) },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(result.resetAt),
            'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          },
        }
      );
    }

    const response = await handler(req, ctx);
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    return response;
  };
}
