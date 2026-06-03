import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { requireRole } from '@/lib/auth/requireRole';
import Redirect from '@/lib/db/models/Redirect';
import NotFoundLog from '@/lib/db/models/NotFoundLog';
import { invalidateRedirectCache } from '@/lib/redirects/redirectUtils';

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ['admin']);
  if (auth instanceof NextResponse) return auth;

  await connectToDatabase();
  const { action, ids } = await req.json();

  if (!ids?.length) return NextResponse.json({ error: 'ids required' }, { status: 400 });

  let result: Record<string, unknown> = {};

  if (action === 'enable') {
    await Redirect.updateMany({ _id: { $in: ids } }, { status: 'enabled' });
    result = { updated: ids.length };
  } else if (action === 'disable') {
    await Redirect.updateMany({ _id: { $in: ids } }, { status: 'disabled' });
    result = { updated: ids.length };
  } else if (action === 'delete') {
    await Redirect.deleteMany({ _id: { $in: ids } });
    result = { deleted: ids.length };
  } else if (action === 'resolve-404s') {
    await NotFoundLog.updateMany({ _id: { $in: ids } }, { resolved: true });
    result = { resolved: ids.length };
  }

  invalidateRedirectCache();
  return NextResponse.json({ success: true, ...result });
}
