import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { requireRole } from '@/lib/auth/requireRole';
import ScheduledTask from '@/lib/db/models/ScheduledTask';
import { initializeScheduler } from '@/lib/scheduler';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/scheduler
 * List all scheduled tasks with stats. Admin only.
 */
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ['admin']);
  if (auth instanceof NextResponse) return auth;

  await initializeScheduler();
  await connectToDatabase();

  const tasks = await ScheduledTask.find().sort({ taskId: 1 }).lean();

  const stats = {
    total:    tasks.length,
    enabled:  tasks.filter(t => t.enabled).length,
    disabled: tasks.filter(t => !t.enabled).length,
    failed:   tasks.filter(t => t.status === 'failed').length,
    running:  tasks.filter(t => t.status === 'running').length,
  };

  return NextResponse.json({ tasks, stats });
}
