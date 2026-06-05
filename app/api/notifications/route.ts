import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { getCurrentUser } from '@/lib/auth/jwt';
import { connectToDatabase } from '@/lib/db/mongodb';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const authUser = await getCurrentUser();
    if (!authUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const Notification = (await import('@/lib/db/models/Notification')).default;

    const userId = new Types.ObjectId(authUser.id);
    const notifications = await Notification
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const unreadCount = notifications.filter(n => !n.read).length;

    return NextResponse.json({ notifications, unreadCount });
  } catch (err: any) {
    console.error('[GET /api/notifications]', err);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
