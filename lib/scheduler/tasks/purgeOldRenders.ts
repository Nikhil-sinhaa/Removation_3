import { TaskResult } from '../engine';
import { connectToDatabase } from '@/lib/db/mongodb';

export async function purgeOldRendersTask(): Promise<TaskResult> {
  await connectToDatabase();

  const Render = (await import('@/lib/db/models/Render')).Render;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);

  const result = await Render.deleteMany({
    createdAt:  { $lt: cutoff },
    projectId:  { $exists: false },
  });

  return {
    success: true,
    message: `Deleted ${result.deletedCount} renders older than 90 days`,
    details: { deletedCount: result.deletedCount, cutoffDate: cutoff.toISOString() },
  };
}
