import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { getCurrentUser } from '@/lib/auth/jwt';
import Announcement from '@/lib/db/models/Announcement';
import DismissedAnnouncement from '@/lib/db/models/DismissedAnnouncement';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authUser = await getCurrentUser();
  if (!authUser) return NextResponse.json({ announcements: [] });

  await connectToDatabase();

  // Fetch full user for plan/role/createdAt targeting
  const User = mongoose.models['User'];
  const dbUser = User ? await User.findById(authUser.id).lean() as Record<string, unknown> | null : null;

  const now      = new Date();
  const userPlan = (dbUser?.subscription as { plan?: string } | undefined)?.plan || 'free';
  const userRole = (dbUser?.role as string | undefined) || 'customer';
  const joinedAt = dbUser?.createdAt as Date | undefined;
  const isNewUser = joinedAt
    ? (now.getTime() - new Date(joinedAt).getTime()) < 7 * 24 * 60 * 60 * 1000
    : false;

  const validTargets: string[] = ['all'];
  if (userPlan === 'free')        validTargets.push('free');
  if (userPlan === 'pro')         validTargets.push('pro');
  if (userPlan === 'teams')       validTargets.push('teams');
  if (userRole === 'designer')    validTargets.push('designers');
  if (userRole === 'contractor')  validTargets.push('contractors');
  if (isNewUser)                  validTargets.push('new_users');

  const announcements = await Announcement.find({
    isActive: true,
    target:   { $in: validTargets },
    startsAt: { $lte: now },
    $or: [
      { endsAt: { $exists: false } },
      { endsAt: null },
      { endsAt: { $gte: now } },
    ],
  })
  .sort({ createdAt: -1 })
  .limit(10)
  .lean();

  if (!announcements.length) {
    return NextResponse.json({ announcements: [] });
  }

  const announcementIds = announcements.map(a => a._id);
  const dismissed = await DismissedAnnouncement.find({
    userId:         new mongoose.Types.ObjectId(authUser.id),
    announcementId: { $in: announcementIds },
  }).lean();

  const dismissedIds = new Set(dismissed.map(d => String(d.announcementId)));
  const visible = announcements.filter(a => !dismissedIds.has(String(a._id)));

  if (visible.length > 0) {
    Announcement.updateMany(
      { _id: { $in: visible.map(a => a._id) } },
      { $inc: { impressions: 1 } }
    ).catch(() => {});
  }

  return NextResponse.json({ announcements: visible });
}
