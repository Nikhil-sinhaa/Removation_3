import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { getCurrentUser } from '@/lib/auth/jwt';
import Announcement from '@/lib/db/models/Announcement';
import DismissedAnnouncement from '@/lib/db/models/DismissedAnnouncement';
import mongoose from 'mongoose';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const authUser = await getCurrentUser();
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();
  const { id } = await params;

  try {
    await DismissedAnnouncement.findOneAndUpdate(
      {
        userId:         new mongoose.Types.ObjectId(authUser.id),
        announcementId: new mongoose.Types.ObjectId(id),
      },
      {
        $setOnInsert: {
          userId:         new mongoose.Types.ObjectId(authUser.id),
          announcementId: new mongoose.Types.ObjectId(id),
          dismissedAt:    new Date(),
        },
      },
      { upsert: true }
    );

    Announcement.findByIdAndUpdate(id, { $inc: { dismissals: 1 } }).catch(() => {});
  } catch (err: unknown) {
    if ((err as { code?: number }).code !== 11000) {
      return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
