import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { requireRole } from '@/lib/auth/requireRole';
import Announcement from '@/lib/db/models/Announcement';
import { writeAuditLog } from '@/lib/audit/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ['admin']);
  if (auth instanceof NextResponse) return auth;

  await connectToDatabase();

  const announcements = await Announcement.find()
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name email')
    .lean();

  const now = new Date();
  const stats = {
    total:            announcements.length,
    active:           announcements.filter(a =>
      a.isActive &&
      new Date(a.startsAt) <= now &&
      (!a.endsAt || new Date(a.endsAt) >= now)
    ).length,
    scheduled:        announcements.filter(a =>
      a.isActive && new Date(a.startsAt) > now
    ).length,
    expired:          announcements.filter(a =>
      a.endsAt && new Date(a.endsAt) < now
    ).length,
    totalImpressions: announcements.reduce((s, a) => s + (a.impressions || 0), 0),
  };

  return NextResponse.json({ announcements, stats });
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ['admin']);
  if (auth instanceof NextResponse) return auth;

  await connectToDatabase();
  const body = await req.json();

  const announcement = await Announcement.create({
    ...body,
    createdBy:   auth.user._id,
    impressions: 0,
    dismissals:  0,
    ctaClicks:   0,
  });

  await writeAuditLog(req, auth.user, {
    action:      'system.config.change',
    category:    'system',
    targetType:  'system',
    targetId:    String(announcement._id),
    description: `Created announcement: "${announcement.title}"`,
    metadata:    { type: announcement.type, target: announcement.target },
  });

  return NextResponse.json({ success: true, announcement });
}
