/**
 * PATCH /api/admin/users/[id]/role
 * Body: { role?: string, plan?: string }
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

const VALID_ROLES = ['customer', 'designer', 'contractor', 'vendor', 'admin'] as const;
const VALID_PLANS = ['free', 'pro', 'team'] as const;

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const auth = await requireRole(req, ['admin']);
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  let body: { role?: string; plan?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const { role, plan } = body;

  if (role && !VALID_ROLES.includes(role as typeof VALID_ROLES[number])) {
    return NextResponse.json({ message: `role must be one of: ${VALID_ROLES.join(', ')}` }, { status: 400 });
  }
  if (plan && !VALID_PLANS.includes(plan as typeof VALID_PLANS[number])) {
    return NextResponse.json({ message: `plan must be one of: ${VALID_PLANS.join(', ')}` }, { status: 400 });
  }
  if (!role && !plan) {
    return NextResponse.json({ message: 'Provide at least one of role or plan' }, { status: 400 });
  }

  await connectToDatabase();

  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (role) update.role = role;
  if (plan) update['subscription.plan'] = plan;

  const user = await User.findByIdAndUpdate(id, update, { new: true })
    .select('role subscription.plan email firstName lastName');

  if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });

  const targetName = user.email;
  if (role) {
    await writeAuditLog(req, auth.user, {
      action: 'user.role.change',
      category: 'users',
      targetType: 'user',
      targetId: id,
      targetName,
      description: auditDescription('user.role.change', targetName, role),
      metadata: { newRole: role },
    });
  }
  if (plan) {
    await writeAuditLog(req, auth.user, {
      action: 'user.plan.change',
      category: 'users',
      targetType: 'user',
      targetId: id,
      targetName,
      description: auditDescription('user.plan.change', targetName, plan),
      metadata: { newPlan: plan },
    });
  }

  return NextResponse.json({ success: true, role: user.role, plan: user.subscription.plan });
}
