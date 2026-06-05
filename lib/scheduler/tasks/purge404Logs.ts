import { TaskResult } from '../engine';
import { connectToDatabase } from '@/lib/db/mongodb';

export async function purge404LogsTask(): Promise<TaskResult> {
  await connectToDatabase();

  const NotFoundLog = (await import('@/lib/db/models/NotFoundLog')).default;

  const cutoff90 = new Date();
  cutoff90.setDate(cutoff90.getDate() - 90);

  // Delete resolved 404s older than 90 days
  const resolved = await NotFoundLog.deleteMany({
    resolved:   true,
    lastSeenAt: { $lt: cutoff90 },
  });

  // Delete single-hit unresolved 404s older than 30 days (likely bots)
  const cutoff30 = new Date();
  cutoff30.setDate(cutoff30.getDate() - 30);

  const bots = await NotFoundLog.deleteMany({
    hits:       1,
    resolved:   false,
    lastSeenAt: { $lt: cutoff30 },
  });

  return {
    success: true,
    message: `Deleted ${resolved.deletedCount} resolved and ${bots.deletedCount} single-hit 404 logs`,
    details: {
      resolvedDeleted: resolved.deletedCount,
      botDeleted:      bots.deletedCount,
    },
  };
}
