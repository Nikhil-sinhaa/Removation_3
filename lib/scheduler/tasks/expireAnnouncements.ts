import { TaskResult } from '../engine';
import { connectToDatabase } from '@/lib/db/mongodb';

export async function expireAnnouncementsTask(): Promise<TaskResult> {
  await connectToDatabase();

  const Announcement = (await import('@/lib/db/models/Announcement')).default;

  const now    = new Date();
  const result = await Announcement.updateMany(
    {
      isActive: true,
      endsAt:   { $lt: now, $exists: true, $ne: null },
    },
    { $set: { isActive: false } }
  );

  return {
    success: true,
    message: `Deactivated ${result.modifiedCount} expired announcements`,
    details: { deactivated: result.modifiedCount },
  };
}
