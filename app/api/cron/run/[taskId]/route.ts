import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { executeTask } from '@/lib/scheduler/engine';
import { initializeScheduler } from '@/lib/scheduler';
import { writeAuditLog } from '@/lib/audit/logger';
import { type TaskId } from '@/lib/db/models/ScheduledTask';

interface RouteContext {
  params: Promise<{ taskId: string }>;
}

/**
 * POST /api/cron/run/[taskId]
 * Admin-only manual trigger for any registered task.
 * Audit logged.
 */
export async function POST(req: NextRequest, { params }: RouteContext) {
  const auth = await requireRole(req, ['admin']);
  if (auth instanceof NextResponse) return auth;

  const { taskId } = await params;

  await initializeScheduler();

  const result = await executeTask(taskId as TaskId);

  await writeAuditLog(req, auth.user, {
    action:      'system.config.change',
    category:    'system',
    targetType:  'system',
    targetId:    taskId,
    targetName:  taskId,
    description: `Manually triggered scheduler task: ${taskId}`,
    metadata:    { result },
  });

  return NextResponse.json(result);
}
