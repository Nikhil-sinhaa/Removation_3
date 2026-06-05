import { NextRequest, NextResponse } from 'next/server';
import { findRedirect, invalidateRedirectCache } from '@/lib/redirects/redirectUtils';
import Redirect from '@/lib/db/models/Redirect';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-internal-secret');
  if (!secret || secret !== process.env.INTERNAL_SECRET) {
    return NextResponse.json({ redirect: null });
  }

  const url = req.nextUrl.searchParams.get('url') || '';
  if (!url) return NextResponse.json({ redirect: null });

  const redirect = await findRedirect(url);
  if (!redirect) return NextResponse.json({ redirect: null });

  // Increment hit count asynchronously — fire and forget
  Redirect.findByIdAndUpdate(redirect._id, {
    $inc: { hits: 1 },
    $set: { hitAt: new Date() },
  }).catch(() => {});

  return NextResponse.json({
    redirect: {
      destUrl:    redirect.destUrl,
      statusCode: redirect.statusCode,
    },
  });
}
