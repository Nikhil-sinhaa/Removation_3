import { TaskResult } from '../engine';
import { connectToDatabase } from '@/lib/db/mongodb';

export async function renderStuckCleanupTask(): Promise<TaskResult> {
  await connectToDatabase();

  const Render = (await import('@/lib/db/models/Render')).Render;

  const cutoff = new Date();
  cutoff.setMinutes(cutoff.getMinutes() - 30);

  const result = await Render.updateMany(
    {
      status:    'processing',
      createdAt: { $lt: cutoff },
    },
    {
      $set: {
        status: 'failed',
        error:  'Timed out — marked as failed by scheduler',
      },
    }
  );

  return {
    success: true,
    message: `Marked ${result.modifiedCount} stuck renders as failed`,
    details: { modifiedCount: result.modifiedCount },
  };
}
