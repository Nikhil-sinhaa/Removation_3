import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import ScheduledTask from '@/lib/db/models/ScheduledTask';
import { executeTask } from '@/lib/scheduler/engine';
import { initializeScheduler } from '@/lib/scheduler';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/run
 * Called by Vercel Cron (or external scheduler) every minute.
 * Checks which tasks are due according to their cron expression and runs them.
 *
 * Secured by CRON_SECRET header or query param.
 */
export async function GET(req: NextRequest) {
  const secret =
    req.headers.get('x-cron-secret') ||
    req.nextUrl.searchParams.get('secret');

  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await initializeScheduler();
  await connectToDatabase();

  const now = new Date();

  const dueTasks = await ScheduledTask.find({
    enabled: true,
    status:  { $ne: 'running' },
    $or: [
      { nextRunAt: { $lte: now } },
      { nextRunAt: { $exists: false } },
      { nextRunAt: null },
    ],
  });

  const results: Record<string, unknown> = {};

  for (const task of dueTasks) {
    try {
      if (!isCronDue(task.cronExpression, now)) {
        task.nextRunAt = getNextRunTime(task.cronExpression, now);
        await task.save();
        continue;
      }

      console.log(`[Scheduler] Running task: ${task.taskId}`);
      const result = await executeTask(task.taskId);
      results[task.taskId] = result;

      task.nextRunAt = getNextRunTime(task.cronExpression, now);
      await task.save();
    } catch (err) {
      results[task.taskId] = { success: false, error: String(err) };
    }
  }

  return NextResponse.json({
    ran:       Object.keys(results).length,
    results,
    timestamp: now.toISOString(),
  });
}

// Check whether a cron expression is due at the given time.
// Supports * and star/n interval syntax for each of the 5 fields.
function isCronDue(expression: string, now: Date): boolean {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) return false;
  const [min, hour, day, month, weekday] = parts;

  const check = (field: string, value: number): boolean => {
    if (field === '*') return true;
    if (field.startsWith('*/')) {
      const interval = parseInt(field.slice(2), 10);
      return !isNaN(interval) && value % interval === 0;
    }
    return parseInt(field, 10) === value;
  };

  return (
    check(min,     now.getMinutes()) &&
    check(hour,    now.getHours()) &&
    check(day,     now.getDate()) &&
    check(month,   now.getMonth() + 1) &&
    check(weekday, now.getDay())
  );
}

// Walk forward minute-by-minute from `from` to find the next matching time.
// Caps at 24 hours (1440 iterations) to avoid infinite loops.
function getNextRunTime(expression: string, from: Date): Date {
  const next = new Date(from);
  next.setSeconds(0, 0);
  next.setMinutes(next.getMinutes() + 1);

  for (let i = 0; i < 1440; i++) {
    if (isCronDue(expression, next)) return next;
    next.setMinutes(next.getMinutes() + 1);
  }
  return next;
}
