import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { connectToDatabase } from '@/lib/db/mongodb';

export const dynamic = 'force-dynamic';

/**
 * POST /api/test/notifications/seed
 * Inserts test Notification documents for a given userId.
 * Body: { userId: string, count?: number, type?: string }
 * Returns: { notificationIds: string[] }
 * Blocked in production. Protected by TEST_SECRET.
 */
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }

  const secret = req.headers.get('x-test-secret');
  if (secret !== (process.env.TEST_SECRET || 'test_secret_local')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { userId?: string; count?: number; type?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.userId || !Types.ObjectId.isValid(body.userId)) {
    return NextResponse.json({ error: 'Valid userId is required' }, { status: 400 });
  }

  const count = Math.min(body.count ?? 2, 20);
  const type  = body.type ?? 'system';

  await connectToDatabase();
  const Notification = (await import('@/lib/db/models/Notification')).default;

  const now = Date.now();
  const docs = Array.from({ length: count }, (_, i) => ({
    userId:    new Types.ObjectId(body.userId as string),
    type,
    title:     `Test notification ${i + 1}`,
    body:      'Test body for automated tests',
    read:      false,
    createdAt: new Date(now - i * 1000),
    expiresAt: new Date(now + 90 * 24 * 60 * 60 * 1000),
  }));

  const created = await Notification.insertMany(docs);
  const notificationIds = created.map((n: any) => n._id.toString());

  return NextResponse.json({ notificationIds });
}
