import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { requireRole } from '@/lib/auth/requireRole';
import ScheduledTask from '@/lib/db/models/ScheduledTask';
import { writeAuditLog } from '@/lib/audit/logger';

interface RouteContext {
  params: Promise<{ taskId: string }>;
}

/**
 * PATCH /api/admin/scheduler/[taskId]
 * Enable/disable a task or update its cron expression. Admin only.
 */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const auth = await requireRole(req, ['admin']);
  if (auth instanceof NextResponse) return auth;

  const { taskId } = await params;
  await connectToDatabase();

  const body = await req.json() as { enabled?: boolean; cronExpression?: string };
  const { enabled, cronExpression } = body;

  const update: Record<string, unknown> = {};
  if (typeof enabled === 'boolean') {
    update.enabled = enabled;
    update.status  = enabled ? 'idle' : 'disabled';
  }
  if (cronExpression && typeof cronExpression === 'string') {
    update.cronExpression = cronExpression;
  }

  const task = await ScheduledTask.findOneAndUpdate(
    { taskId },
    update,
    { new: true }
  );

  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  await writeAuditLog(req, auth.user, {
    action:      'system.config.change',
    category:    'system',
    targetType:  'system',
    targetId:    taskId,
    targetName:  task.name,
    description: `Updated scheduler task ${taskId}: ${JSON.stringify(update)}`,
    metadata:    { update },
  });

  return NextResponse.json({ success: true, task });
}
