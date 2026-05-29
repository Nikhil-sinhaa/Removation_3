import { Types } from 'mongoose';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Message } from '@/lib/db/models/Message';
import { pusherServer } from '@/lib/pusher/server';

/**
 * Creates a system message for a booking and triggers a Pusher notification.
 * This helper should be used from server-side route handlers.
 */
export async function sendSystemMessage(bookingId: string | Types.ObjectId, text: string) {
  try {
    await connectToDatabase();

    const message = await Message.create({
      bookingId: new Types.ObjectId(bookingId),
      senderId: null,
      senderRole: 'admin',
      text: text.trim(),
      readAt: null,
      isSystem: true,
    });

    if (pusherServer) {
      try {
        await pusherServer.trigger(`booking-${bookingId.toString()}`, 'new-message', message.toJSON());
      } catch (pusherErr) {
        console.error(`[sendSystemMessage] Pusher trigger failed for booking ${bookingId}:`, pusherErr);
      }
    }

    return message;
  } catch (error) {
    console.error(`[sendSystemMessage] Failed to create system message for booking ${bookingId}:`, error);
    throw error;
  }
}
