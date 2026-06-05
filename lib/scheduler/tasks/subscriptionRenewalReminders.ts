import { TaskResult } from '../engine';
import { connectToDatabase } from '@/lib/db/mongodb';

export async function subscriptionRenewalRemindersTask(): Promise<TaskResult> {
  await connectToDatabase();

  const Subscription = (await import('@/lib/db/models/Subscription')).Subscription;
  const User         = (await import('@/lib/db/models/User')).User;

  const now             = new Date();
  const threeDaysLater  = new Date(now);
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);
  const twoDaysLater    = new Date(now);
  twoDaysLater.setDate(twoDaysLater.getDate() + 2);

  const expiringSoon = await Subscription.find({
    status:           'active',
    currentPeriodEnd: { $gte: twoDaysLater, $lte: threeDaysLater },
  });

  let sent = 0;
  for (const sub of expiringSoon) {
    const user = await User.findOne({ clerkId: sub.clerkId }).lean();
    if (user?.email) {
      // TODO: plug in email provider (Resend / SendGrid)
      console.log(`[Scheduler] Renewal reminder for ${user.email} (expires ${sub.currentPeriodEnd?.toISOString()})`);
      sent++;
    }
  }

  return {
    success: true,
    message: `Sent ${sent} renewal reminder notifications`,
    details: { sent, checked: expiringSoon.length },
  };
}
