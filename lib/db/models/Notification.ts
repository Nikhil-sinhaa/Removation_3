import mongoose, { Schema, Document, Model } from 'mongoose';

export type NotificationType =
  | 'render_ready'
  | 'render_failed'
  | 'booking_accepted'
  | 'booking_rejected'
  | 'booking_completed'
  | 'booking_cancelled'
  | 'booking_message'
  | 'credits_low'
  | 'credits_purchased'
  | 'subscription_expiring'
  | 'badge_unlocked'
  | 'system';

export interface INotification extends Document {
  userId:    mongoose.Types.ObjectId;
  type:      NotificationType;
  title:     string;
  body:      string;
  link?:     string;
  imageUrl?: string;
  read:      boolean;
  createdAt: Date;
  expiresAt?: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: [
      'render_ready', 'render_failed',
      'booking_accepted', 'booking_rejected', 'booking_completed',
      'booking_cancelled', 'booking_message',
      'credits_low', 'credits_purchased',
      'subscription_expiring',
      'badge_unlocked',
      'system',
    ],
    required: true,
  },
  title:     { type: String, required: true },
  body:      { type: String, required: true },
  link:      { type: String },
  imageUrl:  { type: String },
  read:      { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, index: true },
  expiresAt: { type: Date },
}, {
  timestamps: false,
});

// TTL: auto-delete documents when expiresAt is reached
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Compound index: efficient per-user list sorted by time
NotificationSchema.index({ userId: 1, createdAt: -1 });

const Notification: Model<INotification> =
  mongoose.models['Notification'] ||
  mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
