import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { requireRole } from '@/lib/auth/requireRole';
import Redirect from '@/lib/db/models/Redirect';
import { invalidateRedirectCache } from '@/lib/redirects/redirectUtils';
import { writeAuditLog } from '@/lib/audit/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const auth = await requireRole(req, ['admin']);
  if (auth instanceof NextResponse) return auth;

  await connectToDatabase();
  const { id } = await params;
  const body = await req.json();

  const redirect = await Redirect.findByIdAndUpdate(id, { $set: body }, { new: true });
  if (!redirect) return NextResponse.json({ error: 'Redirect not found' }, { status: 404 });

  invalidateRedirectCache();

  await writeAuditLog(req, auth.user, {
    action:      'system.config.change',
    category:    'system',
    targetType:  'system',
    targetId:    id,
    targetName:  redirect.sourceUrl,
    description: `Updated redirect: ${redirect.sourceUrl} → ${redirect.destUrl}`,
    metadata:    { changes: body },
  });

  return NextResponse.json({ success: true, redirect });
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const auth = await requireRole(req, ['admin']);
  if (auth instanceof NextResponse) return auth;

  await connectToDatabase();
  const { id } = await params;

  const redirect = await Redirect.findByIdAndDelete(id);
  if (!redirect) return NextResponse.json({ error: 'Redirect not found' }, { status: 404 });

  invalidateRedirectCache();

  await writeAuditLog(req, auth.user, {
    action:      'system.config.change',
    category:    'system',
    targetType:  'system',
    targetId:    id,
    targetName:  redirect.sourceUrl,
    description: `Deleted redirect: ${redirect.sourceUrl} → ${redirect.destUrl}`,
  });

  return NextResponse.json({ success: true });
}
