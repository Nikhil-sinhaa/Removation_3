import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { requireRole } from '@/lib/auth/requireRole';
import WorkflowTransition from '@/lib/db/models/WorkflowTransition';
import { writeAuditLog } from '@/lib/audit/logger';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const auth = await requireRole(req, ['admin']);
  if (auth instanceof NextResponse) return auth;

  await connectToDatabase();
  const { id } = await params;
  const body = await req.json();

  const transition = await WorkflowTransition.findByIdAndUpdate(
    id,
    { $set: body },
    { new: true }
  );

  if (!transition) return NextResponse.json({ error: 'Transition not found' }, { status: 404 });

  await writeAuditLog(req, auth.user, {
    action:      'system.config.change',
    category:    'system',
    targetType:  'system',
    targetId:    id,
    targetName:  transition.transitionId,
    description: `Updated workflow transition: ${transition.transitionId}`,
    metadata:    { changes: body },
  });

  return NextResponse.json({ success: true, transition });
}
