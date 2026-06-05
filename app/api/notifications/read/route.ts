import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { getCurrentUser } from '@/lib/auth/jwt';
import { connectToDatabase } from '@/lib/db/mongodb';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: { all?: boolean; notificationIds?: string[] };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    await connectToDatabase();
    const Notification = (await import('@/lib/db/models/Notification')).default;

    const userId = new Types.ObjectId(authUser.id);
    let result;

    if (body.all === true) {
      result = await Notification.updateMany(
        { userId, read: false },
        { $set: { read: true } }
      );
    } else if (Array.isArray(body.notificationIds) && body.notificationIds.length > 0) {
      const ids = body.notificationIds
        .filter(id => Types.ObjectId.isValid(id))
        .map(id => new Types.ObjectId(id));
      result = await Notification.updateMany(
        { _id: { $in: ids }, userId },
        { $set: { read: true } }
      );
    } else {
      return NextResponse.json(
        { error: 'Provide notificationIds array or all: true' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, updatedCount: result.modifiedCount });
  } catch (err: any) {
    console.error('[POST /api/notifications/read]', err);
    return NextResponse.json({ error: 'Failed to mark notifications read' }, { status: 500 });
  }
}
