import { TaskResult } from '../engine';
import { connectToDatabase } from '@/lib/db/mongodb';

export async function purgeAuditLogsTask(): Promise<TaskResult> {
  await connectToDatabase();

  const AuditLog = (await import('@/lib/db/models/AuditLog')).default;

  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 1);

  const result = await AuditLog.deleteMany({ createdAt: { $lt: cutoff } });

  return {
    success: true,
    message: `Deleted ${result.deletedCount} audit log entries older than 1 year`,
    details: { deletedCount: result.deletedCount, cutoffDate: cutoff.toISOString() },
  };
}
