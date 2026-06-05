import { TaskResult } from '../engine';
import { connectToDatabase } from '@/lib/db/mongodb';

export async function purgeExpiredExportsTask(): Promise<TaskResult> {
  await connectToDatabase();

  const PrivacyRequest = (await import('@/lib/db/models/PrivacyRequest')).default;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);

  // Remove completed export records older than 7 days
  const result = await PrivacyRequest.deleteMany({
    type:      'export',
    status:    'completed',
    createdAt: { $lt: cutoff },
  });

  return {
    success: true,
    message: `Deleted ${result.deletedCount} expired data export records`,
    details: { deletedCount: result.deletedCount, cutoffDate: cutoff.toISOString() },
  };
}
