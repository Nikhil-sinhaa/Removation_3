// lib/db/models/Subscription.ts
import mongoose, { Schema, Model } from 'mongoose';

export interface ISubscription {
    clerkId: string;

    // Subscription details
    plan: 'free' | 'pro' | 'team';
    status: 'active' | 'inactive' | 'canceled' | 'past_due' | 'trialing';
    paymentMethod: 'stripe' | 'razorpay' | 'none';

    // Provider IDs
    stripeSubscriptionId?: string;
    stripeCustomerId?: string;
    razorpaySubscriptionId?: string;
    razorpayCustomerId?: string;

    // Billing period
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    trialEnd?: Date;

    // Cancellation
    cancelAtPeriodEnd: boolean;
    canceledAt?: Date;
    cancelReason?: string;

    // Metadata
    createdAt: Date;
    updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>({
    clerkId: { type: String, required: true, unique: true, index: true },

    plan: {
        type: String,
        enum: ['free', 'pro', 'team'],
        default: 'free',
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'canceled', 'past_due', 'trialing'],
        default: 'inactive',
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['stripe', 'razorpay', 'none'],
        default: 'none'
    },

    stripeSubscriptionId: { type: String, sparse: true, unique: true },
    stripeCustomerId: String,
    razorpaySubscriptionId: { type: String, sparse: true, unique: true },
    razorpayCustomerId: String,

    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    trialEnd: Date,

    cancelAtPeriodEnd: { type: Boolean, default: false },
    canceledAt: Date,
    cancelReason: String,

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Update timestamp
SubscriptionSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// Indexes
SubscriptionSchema.index({ status: 1, currentPeriodEnd: 1 });

export const Subscription: Model<ISubscription> = mongoose.models.Subscription || mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
export default Subscription;
