import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { getCurrentUser } from '@/lib/auth/jwt';
import { connectToDatabase } from '@/lib/db/mongodb';

export const runtime = 'nodejs';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid notification ID' }, { status: 400 });
    }

    await connectToDatabase();
    const Notification = (await import('@/lib/db/models/Notification')).default;

    const userId = new Types.ObjectId(authUser.id);
    await Notification.findOneAndDelete({ _id: new Types.ObjectId(id), userId });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[DELETE /api/notifications/[id]]', err);
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
  }
}
