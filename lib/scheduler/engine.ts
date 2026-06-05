import { connectToDatabase } from '@/lib/db/mongodb';
import ScheduledTask, { TaskId, TaskStatus } from '@/lib/db/models/ScheduledTask';

export interface TaskResult {
  success:  boolean;
  message:  string;
  details?: Record<string, unknown>;
}

export type TaskHandler = () => Promise<TaskResult>;

interface TaskDefault {
  taskId:         TaskId;
  name:           string;
  description:    string;
  cronExpression: string;
  enabled:        boolean;
  status:         TaskStatus;
  runCount:       number;
  failCount:      number;
}

const taskRegistry = new Map<TaskId, TaskHandler>();

export function registerTask(taskId: TaskId, handler: TaskHandler) {
  taskRegistry.set(taskId, handler);
}

/**
 * Execute a single task by ID.
 * Never throws — all errors caught and stored as 'failed' status.
 */
export async function executeTask(taskId: TaskId): Promise<TaskResult> {
  await connectToDatabase();

  const task = await ScheduledTask.findOne({ taskId });
  if (!task) return { success: false, message: `Task ${taskId} not found` };
  if (!task.enabled) return { success: false, message: 'Task is disabled' };
  if (task.status === 'running') return { success: false, message: 'Task already running' };

  const handler = taskRegistry.get(taskId);
  if (!handler) return { success: false, message: `No handler registered for ${taskId}` };

  task.status = 'running';
  await task.save();

  const startTime = Date.now();
  let result: TaskResult;

  try {
    result = await handler();
    task.status        = 'success';
    task.lastRunResult = result.message;
    task.runCount      = (task.runCount || 0) + 1;
  } catch (err) {
    result = { success: false, message: String(err) };
    task.status        = 'failed';
    task.lastRunResult = String(err);
    task.failCount     = (task.failCount || 0) + 1;
  }

  task.lastRunAt       = new Date();
  task.lastRunDuration = Date.now() - startTime;
  await task.save();

  return result;
}

/**
 * Seed default tasks into DB if they don't exist.
 * Uses $setOnInsert so admin-modified cron expressions are never overwritten.
 */
export async function seedDefaultTasks() {
  await connectToDatabase();

  const defaults: TaskDefault[] = [
    {
      taskId:         'purge.old.renders',
      name:           'Purge Old Renders',
      description:    'Delete renders older than 90 days not saved to any project',
      cronExpression: '0 3 * * *',
      enabled:        true,
      status:         'idle',
      runCount:       0,
      failCount:      0,
    },
    {
      taskId:         'purge.audit.logs',
      name:           'Purge Old Audit Logs',
      description:    'Delete audit log entries older than 365 days',
      cronExpression: '0 4 1 * *',
      enabled:        true,
      status:         'idle',
      runCount:       0,
      failCount:      0,
    },
    {
      taskId:         'purge.expired.exports',
      name:           'Purge Expired Data Exports',
      description:    'Delete privacy data export records older than 7 days',
      cronExpression: '0 2 * * *',
      enabled:        true,
      status:         'idle',
      runCount:       0,
      failCount:      0,
    },
    {
      taskId:         'cloudinary.cleanup',
      name:           'Cloudinary Orphan Cleanup',
      description:    'Remove Cloudinary images no longer referenced by any render or project',
      cronExpression: '0 5 * * 0',
      enabled:        true,
      status:         'idle',
      runCount:       0,
      failCount:      0,
    },
    {
      taskId:         'subscription.renewal.reminders',
      name:           'Subscription Renewal Reminders',
      description:    'Send email reminders to users whose subscription expires in 3 days',
      cronExpression: '0 9 * * *',
      enabled:        true,
      status:         'idle',
      runCount:       0,
      failCount:      0,
    },
    {
      taskId:         'subscription.expiry.check',
      name:           'Subscription Expiry Check',
      description:    'Move expired active subscriptions to past_due status',
      cronExpression: '*/30 * * * *',
      enabled:        true,
      status:         'idle',
      runCount:       0,
      failCount:      0,
    },
    {
      taskId:         'send.weekly.digest',
      name:           'Weekly Usage Digest',
      description:    'Send weekly summary email to users showing render usage and credits',
      cronExpression: '0 10 * * 1',
      enabled:        false,
      status:         'idle',
      runCount:       0,
      failCount:      0,
    },
    {
      taskId:         'render.stuck.cleanup',
      name:           'Stuck Render Cleanup',
      description:    'Mark renders stuck in "processing" for more than 30 minutes as failed',
      cronExpression: '*/15 * * * *',
      enabled:        true,
      status:         'idle',
      runCount:       0,
      failCount:      0,
    },
    {
      taskId:         'redis.cache.flush',
      name:           'Redis Cache Flush',
      description:    'Clear expired Redis cache keys to free memory',
      cronExpression: '0 1 * * *',
      enabled:        true,
      status:         'idle',
      runCount:       0,
      failCount:      0,
    },
    {
      taskId:         'db.stats.snapshot',
      name:           'Database Stats Snapshot',
      description:    'Record daily DB stats: total users, renders, projects',
      cronExpression: '59 23 * * *',
      enabled:        true,
      status:         'idle',
      runCount:       0,
      failCount:      0,
    },
    {
      taskId:         'purge.404.logs',
      name:           'Purge Old 404 Logs',
      description:    'Delete resolved and single-hit 404 log entries to keep the table clean',
      cronExpression: '0 3 * * 0',
      enabled:        true,
      status:         'idle',
      runCount:       0,
      failCount:      0,
    },
    {
      taskId:         'purge.old.snapshots',
      name:           'Purge Old Project Snapshots',
      description:    'Delete non-pinned project snapshots older than 90 days and enforce 50-snapshot limit per project',
      cronExpression: '0 4 * * 0',
      enabled:        true,
      status:         'idle',
      runCount:       0,
      failCount:      0,
    },
    {
      taskId:         'expire.announcements',
      name:           'Expire Old Announcements',
      description:    'Auto-deactivate announcements whose end date has passed',
      cronExpression: '*/30 * * * *',
      enabled:        true,
      status:         'idle',
      runCount:       0,
      failCount:      0,
    },
    {
      taskId:         'notify.low.credits',
      name:           'Notify Low Credits',
      description:    'Notify users whose credits are running low (once per 7 days)',
      cronExpression: '0 10 * * *',
      enabled:        true,
      status:         'idle',
      runCount:       0,
      failCount:      0,
    },
    {
      taskId:         'feedback.reminder',
      name:           'Feedback Reminder',
      description:    'Remind users to rate renders created in the last 24-48 hours',
      cronExpression: '0 18 * * *',
      enabled:        true,
      status:         'idle',
      runCount:       0,
      failCount:      0,
    },
  ];

  for (const task of defaults) {
    await ScheduledTask.findOneAndUpdate(
      { taskId: task.taskId },
      { $setOnInsert: task },
      { upsert: true, new: true }
    );
  }
  console.log('[Scheduler] Default tasks seeded');
}
