import { TaskResult } from '../engine';
import { connectToDatabase } from '@/lib/db/mongodb';

export async function subscriptionExpiryCheckTask(): Promise<TaskResult> {
  await connectToDatabase();

  const Subscription = (await import('@/lib/db/models/Subscription')).Subscription;
  const User         = (await import('@/lib/db/models/User')).User;

  const now = new Date();

  // Find active subscriptions whose billing period has ended
  const expired = await Subscription.find({
    status:           'active',
    currentPeriodEnd: { $lt: now },
    cancelAtPeriodEnd: false,
  });

  let downgraded = 0;
  for (const sub of expired) {
    // Move subscription to past_due
    await Subscription.findByIdAndUpdate(sub._id, { status: 'past_due' });

    // Sync the user's embedded subscription
    await User.findOneAndUpdate(
      { clerkId: sub.clerkId },
      {
        'subscription.plan':   'free',
        'subscription.status': 'past_due',
      }
    );
    downgraded++;
  }

  return {
    success: true,
    message: `Moved ${downgraded} expired subscriptions to past_due`,
    details: { downgraded },
  };
}
