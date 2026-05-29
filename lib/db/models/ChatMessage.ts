// lib/db/models/ChatMessage.ts
//
// A single message in a booking's chat thread.
// Each booking has its own thread keyed by bookingId.

import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IChatMessage {
    bookingId: Types.ObjectId;
    senderId: Types.ObjectId;
    senderName: string;
    senderRole: 'customer' | 'designer' | 'contractor';
    text: string;
    createdAt: Date;
    updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
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
            required: true,
        },
        senderName: {
            type: String,
            required: true,
            maxlength: 100,
        },
        senderRole: {
            type: String,
            enum: ['customer', 'designer', 'contractor'],
            required: true,
        },
        text: {
            type: String,
            required: true,
            minlength: [1, 'Message cannot be empty'],
            maxlength: [2000, 'Message cannot exceed 2000 characters'],
        },
    },
    { timestamps: true }
);

ChatMessageSchema.index({ bookingId: 1, createdAt: 1 });

export const ChatMessage: Model<IChatMessage> =
    mongoose.models.ChatMessage ||
    mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);

export default ChatMessage;
