/**
 * PATCH /api/admin/users/[id]/status
 * Body: { status: 'active' | 'banned' | 'suspended' }
 * Admin only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import { User } from '@/lib/db/models/User';
import { writeAuditLog, auditDescription } from '@/lib/audit/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const VALID_STATUSES = ['active', 'banned', 'suspended'] as const;
type AccountStatus = typeof VALID_STATUSES[number];

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const auth = await requireRole(req, ['admin']);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  let body: { status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const { status } = body;
  if (!status || !VALID_STATUSES.includes(status as AccountStatus)) {
    return NextResponse.json(
      { message: `status must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 },
    );
  }

  await connectToDatabase();

  const user = await User.findByIdAndUpdate(
    id,
    { accountStatus: status as AccountStatus, updatedAt: new Date() },
    { new: true },
  ).select('-password -otp -otpExpiry');

  if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

  const actionMap: Record<AccountStatus, 'user.ban' | 'user.unban' | 'user.suspend'> = {
    banned:    'user.ban',
    active:    'user.unban',
    suspended: 'user.suspend',
  };
  const action = actionMap[status as AccountStatus];
  const targetName = user.email;
  await writeAuditLog(req, auth.user, {
    action,
    category: 'users',
    targetType: 'user',
    targetId: id,
    targetName,
    description: auditDescription(action, targetName),
    metadata: { newStatus: status },
  });

  return NextResponse.json({ success: true, accountStatus: user.accountStatus });
}
