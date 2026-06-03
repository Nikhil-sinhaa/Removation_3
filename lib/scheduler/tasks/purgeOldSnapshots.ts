import type { TaskResult } from '../engine';
import { connectToDatabase } from '@/lib/db/mongodb';

export async function purgeOldSnapshotsTask(): Promise<TaskResult> {
  await connectToDatabase();

  const { default: Snapshot } = await import('@/lib/db/models/Snapshot');

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);

  // Delete non-pinned snapshots older than 90 days
  const aged = await Snapshot.deleteMany({
    isPinned:  false,
    createdAt: { $lt: cutoff },
  });

  // Enforce 50-snapshot limit per project for non-pinned
  const counts = await Snapshot.aggregate([
    { $group: { _id: '$projectId', count: { $sum: 1 } } },
    { $match: { count: { $gt: 50 } } },
  ]);

  let excessDeleted = 0;
  for (const { _id: projectId, count } of counts) {
    const toDelete = count - 50;
    const oldest   = await Snapshot
      .find({ projectId, isPinned: false })
      .sort({ version: 1 })
      .limit(toDelete)
      .lean();

    if (oldest.length > 0) {
      const result = await Snapshot.deleteMany({
        _id: { $in: oldest.map(s => s._id) },
      });
      excessDeleted += result.deletedCount;
    }
  }

  return {
    success: true,
    message: `Purged ${aged.deletedCount} aged snapshots, ${excessDeleted} excess snapshots`,
    details: { agedDeleted: aged.deletedCount, excessDeleted },
  };
}
