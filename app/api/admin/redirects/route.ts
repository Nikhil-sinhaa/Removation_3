import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { requireRole } from '@/lib/auth/requireRole';
import Redirect from '@/lib/db/models/Redirect';
import NotFoundLog from '@/lib/db/models/NotFoundLog';
import { invalidateRedirectCache } from '@/lib/redirects/redirectUtils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ['admin']);
  if (auth instanceof NextResponse) return auth;

  await connectToDatabase();

  const { searchParams } = req.nextUrl;
  const tab    = searchParams.get('tab') || 'redirects';
  const page   = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const search = searchParams.get('q') || '';
  const limit  = 50;

  if (tab === '404s') {
    const query: Record<string, unknown> = { resolved: false };
    if (search) query.url = { $regex: search, $options: 'i' };

    const [logs, total] = await Promise.all([
      NotFoundLog.find(query)
        .sort({ hits: -1, lastSeenAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      NotFoundLog.countDocuments(query),
    ]);

    return NextResponse.json({ logs, total, page });
  }

  const query: Record<string, unknown> = {};
  if (search) {
    query.$or = [
      { sourceUrl: { $regex: search, $options: 'i' } },
      { destUrl:   { $regex: search, $options: 'i' } },
    ];
  }

  const [redirects, total, stats] = await Promise.all([
    Redirect.find(query)
      .sort({ hits: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Redirect.countDocuments(query),
    Promise.all([
      Redirect.countDocuments({ status: 'enabled' }),
      Redirect.countDocuments({ status: 'disabled' }),
      Redirect.countDocuments({ origin: 'from_404' }),
      NotFoundLog.countDocuments({ resolved: false }),
      Redirect.aggregate([{ $group: { _id: null, totalHits: { $sum: '$hits' } } }]),
    ]).then(([enabled, disabled, from404, unresolved404s, hitsAgg]) => ({
      enabled,
      disabled,
      from404,
      unresolved404s,
      totalHits: (hitsAgg[0] as { totalHits?: number } | undefined)?.totalHits ?? 0,
    })),
  ]);

  return NextResponse.json({ redirects, total, page, stats });
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ['admin']);
  if (auth instanceof NextResponse) return auth;

  await connectToDatabase();
  const body = await req.json();
  const { sourceUrl, destUrl, statusCode, comment, from404Id } = body;

  if (!sourceUrl?.trim() || !destUrl?.trim()) {
    return NextResponse.json({ error: 'sourceUrl and destUrl are required' }, { status: 400 });
  }

  const source = sourceUrl.trim().toLowerCase();
  const dest   = destUrl.trim();

  const redirect = await Redirect.findOneAndUpdate(
    { sourceUrl: source },
    {
      $set: {
        sourceUrl:  source,
        destUrl:    dest,
        statusCode: statusCode || 301,
        status:     'enabled',
        comment:    comment || '',
        origin:     from404Id ? 'from_404' : 'manual',
      },
    },
    { upsert: true, new: true }
  );

  if (from404Id) {
    await NotFoundLog.findByIdAndUpdate(from404Id, { resolved: true });
  }

  invalidateRedirectCache();
  return NextResponse.json({ success: true, redirect });
}
