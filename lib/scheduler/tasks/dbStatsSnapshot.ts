import { TaskResult } from '../engine';
import { connectToDatabase } from '@/lib/db/mongodb';

export async function dbStatsSnapshotTask(): Promise<TaskResult> {
  await connectToDatabase();

  const User         = (await import('@/lib/db/models/User')).User;
  const Render       = (await import('@/lib/db/models/Render')).Render;
  const Subscription = (await import('@/lib/db/models/Subscription')).Subscription;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [totalUsers, totalRenders, activeSubscriptions, todayUsers, todayRenders] =
    await Promise.all([
      User.countDocuments(),
      Render.countDocuments(),
      Subscription.countDocuments({ status: 'active' }),
      User.countDocuments({ createdAt: { $gte: todayStart } }),
      Render.countDocuments({ createdAt: { $gte: todayStart } }),
    ]);

  const snapshot = {
    date:                new Date().toISOString().split('T')[0],
    totalUsers,
    totalRenders,
    activeSubscriptions,
    todayNewUsers:       todayUsers,
    todayNewRenders:     todayRenders,
  };

  console.log('[Scheduler] DB Stats Snapshot:', JSON.stringify(snapshot));

  return {
    success: true,
    message: `Snapshot: ${totalUsers} users, ${totalRenders} renders, ${activeSubscriptions} active subs`,
    details: snapshot,
  };
}
