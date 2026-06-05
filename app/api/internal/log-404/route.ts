import { NextRequest, NextResponse } from 'next/server';
import { log404 } from '@/lib/redirects/redirectUtils';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-internal-secret');
  if (!secret || secret !== process.env.INTERNAL_SECRET) {
    return NextResponse.json({ ok: false });
  }

  const { url, referrer } = await req.json();

  // Skip non-page 404s
  if (
    !url ||
    url.startsWith('/api/') ||
    url.startsWith('/_next/') ||
    url.includes('.')
  ) {
    return NextResponse.json({ ok: false });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
  const ua = req.headers.get('user-agent') || '';

  await log404(url, referrer, ip, ua);
  return NextResponse.json({ ok: true });
}
