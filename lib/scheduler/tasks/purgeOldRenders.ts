import { unlink } from 'fs/promises';
import { TaskResult } from '../engine';
import { connectToDatabase } from '@/lib/db/mongodb';

const LOCAL_FILE_FIELDS = ['outputImage', 'generatedImagePath', 'originalImagePath'] as const;

export async function purgeOldRendersTask(): Promise<TaskResult> {
  await connectToDatabase();

  const Render = (await import('@/lib/db/models/Render')).Render;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);

  const query = { createdAt: { $lt: cutoff }, projectId: { $exists: false } };

  // Fetch file paths before deleting DB records
  const toDelete = await Render.find(query).select(LOCAL_FILE_FIELDS.join(' ')).lean();

  let filesDeleted = 0;
  let filesMissing = 0;
  let filesSkipped = 0;

  for (const render of toDelete) {
    for (const field of LOCAL_FILE_FIELDS) {
      const filePath = (render as Record<string, unknown>)[field] as string | undefined;
      if (!filePath) continue;
      if (filePath.startsWith('http')) { filesSkipped++; continue; }

      try {
        await unlink(filePath);
        filesDeleted++;
      } catch (err: any) {
        if (err.code === 'ENOENT') {
          filesMissing++;
        } else {
          console.error(`[purgeOldRenders] Failed to delete ${filePath}:`, err.message);
        }
      }
    }
  }

  const result = await Render.deleteMany(query);

  return {
    success: true,
    message: `Deleted ${result.deletedCount} renders older than 90 days`,
    details: {
      deletedCount:  result.deletedCount,
      cutoffDate:    cutoff.toISOString(),
      filesDeleted,
      filesMissing,
      filesSkipped,
    },
  };
}
