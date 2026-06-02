/**
 * GET  /api/admin/users/[id]  — fetch single user
 * DELETE /api/admin/users/[id] — permanently delete a user
 * Admin only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const auth = await requireRole(req, ['admin']);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  await connectToDatabase();

  const user = await User.findById(id)
    .select('-password -otp -otpExpiry')
    .lean();

  if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });
  return NextResponse.json(user);
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const auth = await requireRole(req, ['admin']);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  await connectToDatabase();

  const user = await User.findByIdAndDelete(id);
  if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

  return NextResponse.json({ success: true, deletedId: id });
}
