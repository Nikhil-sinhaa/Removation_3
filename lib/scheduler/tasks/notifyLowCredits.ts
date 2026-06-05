import { TaskResult } from '../engine';
import { connectToDatabase } from '@/lib/db/mongodb';

const LOW_CREDITS_THRESHOLD = 5;
const COOLDOWN_DAYS         = 7;

export async function notifyLowCreditsTask(): Promise<TaskResult> {
  try {
    await connectToDatabase();

    const User         = (await import('@/lib/db/models/User')).User;
    const Notification = (await import('@/lib/db/models/Notification')).default;
    const { notifyCreditsLow } = await import('@/lib/notifications/send');

    const cooldownDate = new Date();
    cooldownDate.setDate(cooldownDate.getDate() - COOLDOWN_DAYS);

    // Find users with positive but low available credits
    const users = await User.find({
      $expr: {
        $and: [
          { $gt: ['$subscription.credits', 0] },
          { $lte: [
            { $subtract: ['$subscription.credits', '$subscription.creditsUsed'] },
            LOW_CREDITS_THRESHOLD,
          ]},
          { $gt: [
            { $subtract: ['$subscription.credits', '$subscription.creditsUsed'] },
            0,
          ]},
        ],
      },
    }).lean();

    let notified = 0;

    for (const user of users) {
      // Skip if already notified within the cooldown window
      const recentNotif = await Notification.findOne({
        userId:    user._id,
        type:      'credits_low',
        createdAt: { $gte: cooldownDate },
      }).lean();

      if (recentNotif) continue;

      const remaining = (user.subscription?.credits ?? 0) - (user.subscription?.creditsUsed ?? 0);
      await notifyCreditsLow(user._id.toString(), remaining);
      notified++;
    }

    console.log(`[Scheduler] notifyLowCredits: notified ${notified} of ${users.length} qualifying users`);

    return {
      success: true,
      message: `Notified ${notified} users with low credits`,
      details: { notified, checked: users.length },
    };
  } catch (err) {
    console.error('[notifyLowCredits] Task failed:', err);
    return { success: false, message: String(err) };
  }
}
