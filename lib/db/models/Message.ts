import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IMessage {
  bookingId: Types.ObjectId;
  senderId?: Types.ObjectId | null;
  senderRole: 'customer' | 'designer' | 'contractor' | 'admin';
  text: string;
  readAt: Date | null;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      default: null,
    },
    senderRole: {
      type: String,
      enum: ['customer', 'designer', 'contractor', 'admin'],
      required: true,
    },
    text: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 2000,
      trim: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// For fetching thread in order
MessageSchema.index({ bookingId: 1, createdAt: 1 });
// For unread count
MessageSchema.index({ bookingId: 1, senderId: 1, readAt: 1 });

export const Message: Model<IMessage> =
  mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

export default Message;
