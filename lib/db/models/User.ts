// lib/db/models/User.ts
import mongoose, { Schema, Model } from 'mongoose';

export interface IUser {
    clerkId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    imageUrl?: string;
    credits: number;

    // Subscription info
    subscription: {
        plan: 'free' | 'pro' | 'team';
        status: 'active' | 'inactive' | 'canceled' | 'past_due';
        credits: number;
        creditsUsed: number;
        currentPeriodStart?: Date;
        currentPeriodEnd?: Date;
        resetDate?: Date;
        cancelAtPeriodEnd: boolean;
        canceledAt?: Date;
        paymentMethod?: 'stripe' | 'razorpay' | 'none';
    };

    // Payment provider IDs
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    razorpayCustomerId?: string;
    razorpaySubscriptionId?: string;

    // History
    creditHistory: Array<{
        amount: number;
        type: string;
        description: string;
        createdAt: Date;
    }>;

    paymentHistory: Array<{
        sessionId?: string;
        paymentId?: string;
        orderId?: string;
        amount: number;
        currency: string;
        type: string;
        credits?: number;
        status: string;
        createdAt: Date;
    }>;

    // Metadata
    lastRenderAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
    clerkId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true },
    firstName: String,
    lastName: String,
    imageUrl: String,
    credits: { type: Number, default: 10 }, // Legacy field for backward compatibility

    subscription: {
        plan: { type: String, enum: ['free', 'pro', 'team'], default: 'free' },
        status: { type: String, enum: ['active', 'inactive', 'canceled', 'past_due'], default: 'inactive' },
        credits: { type: Number, default: 10 },
        creditsUsed: { type: Number, default: 0 },
        currentPeriodStart: Date,
        currentPeriodEnd: Date,
        resetDate: Date,
        cancelAtPeriodEnd: { type: Boolean, default: false },
        canceledAt: Date,
        paymentMethod: { type: String, enum: ['stripe', 'razorpay', 'none'], default: 'none' },
    },

    stripeCustomerId: String,
    stripeSubscriptionId: String,
    razorpayCustomerId: String,
    razorpaySubscriptionId: String,

    creditHistory: [{
        amount: Number,
        type: String,
        description: String,
        createdAt: { type: Date, default: Date.now },
    }],

    paymentHistory: [{
        sessionId: String,
        paymentId: String,
        orderId: String,
        amount: Number,
        currency: String,
        type: String,
        credits: Number,
        status: String,
        createdAt: { type: Date, default: Date.now },
    }],

    lastRenderAt: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Update the updatedAt timestamp on save
UserSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
