import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';

/**
 * POST /api/test/cleanup
 * Removes test data created by /api/test/setup.
 * ONLY available outside production.
 */
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }

  const secret = req.headers.get('x-test-secret');
  if (secret !== (process.env.TEST_SECRET || 'test_secret_local')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectToDatabase();

  const mongoose = (await import('mongoose')).default;

  const testEmails = [
    'admin@test.removation.ai',
    'user@test.removation.ai',
    'designer@test.removation.ai',
  ];

  const User            = mongoose.models['User'];
  const AuditLog        = mongoose.models['AuditLog'];
  const TourProgress    = mongoose.models['TourProgress'];
  const Redirect        = mongoose.models['Redirect'];
  const Tag             = mongoose.models['Tag'];
  const Tagging         = mongoose.models['Tagging'];
  const PrivacyRequest  = mongoose.models['PrivacyRequest'];
  const WorkflowEvent   = mongoose.models['WorkflowEvent'];
  const Booking         = mongoose.models['Booking'];

  const users = User
    ? await User.find({ email: { $in: testEmails } }).lean()
    : [];
  const userIds = (users as Array<{ _id: unknown }>).map(u => u._id);

  await Promise.allSettled([
    AuditLog?.deleteMany({ adminEmail: { $in: testEmails } }),
    TourProgress?.deleteMany({ userId: { $in: userIds } }),
    PrivacyRequest?.deleteMany({ userId: { $in: userIds } }),
    WorkflowEvent?.deleteMany({ triggeredBy: { $in: userIds } }),
    Booking?.deleteMany({ $or: [{ customerId: { $in: userIds } }, { userId: { $in: userIds } }] }),
    Redirect?.deleteMany({ sourceUrl: { $regex: '/test-redirect' } }),
    Tag?.deleteMany({ userId: { $in: userIds }, isGlobal: false }),
    Tagging?.deleteMany({ userId: { $in: userIds } }),
  ]);

  return NextResponse.json({ success: true, cleaned: userIds.length });
}
