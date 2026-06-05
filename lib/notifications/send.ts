import { Types } from 'mongoose';
import { connectToDatabase } from '@/lib/db/mongodb';
import type { NotificationType } from '@/lib/db/models/Notification';

export type { NotificationType };

export interface NotificationPayload {
  userId:    string;
  type:      NotificationType;
  title:     string;
  body:      string;
  link?:     string;
  imageUrl?: string;
}

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

export async function sendNotification(payload: NotificationPayload): Promise<void> {
  try {
    await connectToDatabase();
    const Notification = (await import('@/lib/db/models/Notification')).default;
    await Notification.create({
      userId:    new Types.ObjectId(payload.userId),
      type:      payload.type,
      title:     payload.title,
      body:      payload.body,
      link:      payload.link,
      imageUrl:  payload.imageUrl,
      expiresAt: new Date(Date.now() + NINETY_DAYS_MS),
    });
  } catch (err) {
    console.error('[sendNotification] Failed to create notification:', err);
  }
}

export async function sendNotificationBulk(
  userIds: string[],
  payload: Omit<NotificationPayload, 'userId'>
): Promise<void> {
  await Promise.all(userIds.map(userId => sendNotification({ ...payload, userId })));
}

// ── Named helpers ──────────────────────────────────────────────────────────────

export async function notifyRenderReady(
  userId: string,
  renderId: string,
  thumbnailUrl: string
): Promise<void> {
  return sendNotification({
    userId,
    type:     'render_ready',
    title:    'Your render is ready!',
    body:     'Click to view and download your result.',
    link:     `/dashboard/renders/${renderId}`,
    imageUrl: thumbnailUrl,
  });
}

export async function notifyRenderFailed(
  userId: string,
  featureName: string
): Promise<void> {
  return sendNotification({
    userId,
    type:  'render_failed',
    title: 'Generation failed',
    body:  `Your ${featureName} generation could not be completed. Please try again.`,
    link:  '/dashboard',
  });
}

export async function notifyBookingAccepted(
  userId: string,
  bookingId: string,
  designerName: string
): Promise<void> {
  return sendNotification({
    userId,
    type:  'booking_accepted',
    title: 'Booking accepted!',
    body:  `${designerName} has accepted your booking request.`,
    link:  `/dashboard/bookings/${bookingId}`,
  });
}

export async function notifyBookingRejected(
  userId: string,
  bookingId: string,
  designerName: string
): Promise<void> {
  return sendNotification({
    userId,
    type:  'booking_rejected',
    title: 'Booking not accepted',
    body:  `${designerName} could not accept your booking at this time.`,
    link:  '/dashboard/bookings',
  });
}

export async function notifyBookingCompleted(
  userId: string,
  bookingId: string
): Promise<void> {
  return sendNotification({
    userId,
    type:  'booking_completed',
    title: 'Project completed!',
    body:  'Your project has been marked as complete. Please leave a review.',
    link:  `/dashboard/bookings/${bookingId}`,
  });
}

export async function notifyCreditsPurchased(
  userId: string,
  amount: number
): Promise<void> {
  return sendNotification({
    userId,
    type:  'credits_purchased',
    title: 'Credits added!',
    body:  `${amount} credits have been added to your account.`,
    link:  '/dashboard/billing',
  });
}

export async function notifyCreditsLow(
  userId: string,
  remaining: number
): Promise<void> {
  return sendNotification({
    userId,
    type:  'credits_low',
    title: 'Credits running low',
    body:  `You have ${remaining} credits left. Top up to keep generating.`,
    link:  '/dashboard/billing',
  });
}

export async function notifyGenerationComplete(
  userId: string,
  projectId: string,
  imageUrl: string,
  featureName: string
): Promise<void> {
  const featureLabels: Record<string, string> = {
    'room-changer':        'Room Changer',
    'lighting':            'AI Lighting Studio',
    'style-transfer':      'Style Transfer',
    'furniture-remover':   'Furniture Remover',
    'ceiling-changer':     'Ceiling Changer',
    'furniture-placement': 'Furniture Placement',
  };
  const label = featureLabels[featureName] ?? featureName;
  await sendNotification({
    userId,
    type:     'render_ready',
    title:    `Your ${label} result is ready!`,
    body:     'Click to view and download your design.',
    link:     `/projects/${projectId}`,
    imageUrl,
  });
}

// TODO: plug in Slack/email alert when low ratings arrive
export async function notifyAdminLowRating(render: { _id: unknown; rating?: number | null }): Promise<void> {
  console.error(
    `[LowRating] Render ${render._id} received rating ${render.rating ?? '?'} — investigate AI quality.`
  );
}
