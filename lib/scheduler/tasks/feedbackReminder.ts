import { TaskResult } from '../engine';
import { connectToDatabase } from '@/lib/db/mongodb';
import { sendNotification } from '@/lib/notifications/send';

export async function feedbackReminderTask(): Promise<TaskResult> {
  try {
    await connectToDatabase();

    const Render = (await import('@/lib/db/models/Render')).Render;
    const Notification = (await import('@/lib/db/models/Notification')).default;

    const now = new Date();
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Find unrated renders from the last 24–48 hours
    const unratedRenders = await Render.find({
      createdAt: { $gte: fortyEightHoursAgo, $lte: twentyFourHoursAgo },
      rating: null,
      userId: { $exists: true },
      status: 'completed',
    })
      .select('userId')
      .lean();

    // Get unique userIds
    const userIdSet = new Set<string>();
    for (const r of unratedRenders) {
      if (r.userId) {
        userIdSet.add(r.userId.toString());
      }
    }

    let sent = 0;
    for (const userId of userIdSet) {
      // Skip if already sent a feedback reminder to this user in the last 7 days
      const recent = await Notification.findOne({
        userId,
        type: 'system',
        title: 'How did your renders turn out?',
        createdAt: { $gte: sevenDaysAgo },
      }).lean();

      if (recent) continue;

      await sendNotification({
        userId,
        type: 'system',
        title: 'How did your renders turn out?',
        body: 'Rate your recent designs to help us improve the AI.',
        link: '/history',
      });
      sent++;
    }

    return {
      success: true,
      message: `Sent ${sent} feedback reminder notifications`,
      details: { sent, uniqueUsers: userIdSet.size },
    };
  } catch (err) {
    console.error('[feedbackReminder] Task failed:', err);
    return { success: false, message: String(err) };
  }
}
