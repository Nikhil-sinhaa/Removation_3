import { connectToDatabase } from '@/lib/db/mongodb';
import Redirect, { IRedirect } from '@/lib/db/models/Redirect';
import NotFoundLog from '@/lib/db/models/NotFoundLog';

// In-memory cache of enabled redirects — refreshed every 5 minutes
let redirectCache: Map<string, IRedirect> = new Map();
let cacheLastUpdated = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function getRedirectMap(): Promise<Map<string, IRedirect>> {
  const now = Date.now();
  if (redirectCache.size > 0 && now - cacheLastUpdated < CACHE_TTL_MS) {
    return redirectCache;
  }

  await connectToDatabase();

  const redirects = await Redirect.find({ status: 'enabled' }).lean();
  redirectCache = new Map(
    redirects.map(r => [r.sourceUrl.toLowerCase(), r as unknown as IRedirect])
  );
  cacheLastUpdated = now;

  return redirectCache;
}

export function invalidateRedirectCache() {
  redirectCache = new Map();
  cacheLastUpdated = 0;
}

export async function findRedirect(urlPath: string): Promise<IRedirect | null> {
  const map = await getRedirectMap();
  return map.get(urlPath.toLowerCase()) || null;
}

/**
 * Log a 404 hit.
 * Uses upsert to increment hits for repeated 404s on the same URL.
 * Non-blocking — errors are swallowed.
 */
export async function log404(
  url:       string,
  referrer?: string,
  ip?:       string,
  userAgent?: string
): Promise<void> {
  try {
    await connectToDatabase();
    await NotFoundLog.findOneAndUpdate(
      { url },
      {
        $inc:         { hits: 1 },
        $set:         { lastSeenAt: new Date(), referrer, ip, userAgent },
        $setOnInsert: { firstSeenAt: new Date(), resolved: false },
      },
      { upsert: true }
    );
  } catch { /* never block the request */ }
}
