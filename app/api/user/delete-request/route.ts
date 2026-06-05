import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { getCurrentUser } from '@/lib/auth/jwt';
import { User } from '@/lib/db/models/User';
import PrivacyRequest from '@/lib/db/models/PrivacyRequest';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

/**
 * POST /api/user/delete-request
 * User submits an account deletion request. Admin must approve before data is deleted.
 */
export async function POST(req: Request) {
  const authUser = await getCurrentUser();
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();

  const existing = await PrivacyRequest.findOne({
    userId: new mongoose.Types.ObjectId(authUser.id),
    type: 'delete',
    status: { $in: ['pending', 'processing'] },
  });

  if (existing) {
    return NextResponse.json({
      error: 'You already have a pending deletion request.',
      requestId: existing._id,
    }, { status: 409 });
  }

  const body = await req.json().catch(() => ({}));
  const reason: string = body.reason || 'No reason provided';

  const dbUser = await User.findById(authUser.id).lean();
  const userName = [(dbUser as any)?.firstName, (dbUser as any)?.lastName]
    .filter(Boolean).join(' ').trim() || authUser.email;

  const request = await PrivacyRequest.create({
    userId:    new mongoose.Types.ObjectId(authUser.id),
    userEmail: authUser.email,
    userName,
    type:      'delete',
    status:    'pending',
    reason,
  });

  return NextResponse.json({
    success:   true,
    message:   'Your account deletion request has been submitted. An admin will process it within 30 days.',
    requestId: request._id,
  });
}

/**
 * GET /api/user/delete-request
 * Returns the current user's pending deletion request, if any.
 */
export async function GET() {
  const authUser = await getCurrentUser();
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();

  const request = await PrivacyRequest.findOne({
    userId: new mongoose.Types.ObjectId(authUser.id),
    type: 'delete',
    status: { $in: ['pending', 'processing'] },
  });

  return NextResponse.json({ request });
}

/**
 * DELETE /api/user/delete-request
 * User cancels their pending deletion request.
 */
export async function DELETE() {
  const authUser = await getCurrentUser();
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectToDatabase();

  const request = await PrivacyRequest.findOneAndUpdate(
    { userId: new mongoose.Types.ObjectId(authUser.id), type: 'delete', status: 'pending' },
    { status: 'rejected', adminNotes: 'Cancelled by user' },
    { new: true }
  );

  if (!request) {
    return NextResponse.json({ error: 'No pending deletion request found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: 'Deletion request cancelled.' });
}
