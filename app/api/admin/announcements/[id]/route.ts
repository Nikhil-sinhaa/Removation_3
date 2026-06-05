import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { requireRole } from '@/lib/auth/requireRole';
import Announcement from '@/lib/db/models/Announcement';
import { writeAuditLog } from '@/lib/audit/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const auth = await requireRole(req, ['admin']);
  if (auth instanceof NextResponse) return auth;

  await connectToDatabase();
  const { id } = await params;
  const body   = await req.json();

  const announcement = await Announcement.findByIdAndUpdate(
    id,
    { $set: body },
    { new: true }
  );

  if (!announcement) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await writeAuditLog(req, auth.user, {
    action:      'system.config.change',
    category:    'system',
    targetType:  'system',
    targetId:    id,
    description: `Updated announcement: "${announcement.title}"`,
    metadata:    { changes: body },
  });

  return NextResponse.json({ success: true, announcement });
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const auth = await requireRole(req, ['admin']);
  if (auth instanceof NextResponse) return auth;

  await connectToDatabase();
  const { id } = await params;

  const announcement = await Announcement.findByIdAndDelete(id);
  if (!announcement) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await writeAuditLog(req, auth.user, {
    action:      'system.config.change',
    category:    'system',
    targetType:  'system',
    targetId:    id,
    description: `Deleted announcement: "${announcement.title}"`,
  });

  return NextResponse.json({ success: true });
}
