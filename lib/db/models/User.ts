// lib/db/models/User.ts
import mongoose, { Schema, Model } from 'mongoose';

export interface IUser {
    clerkId?: string;
    email: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    imageUrl?: string;
    credits: number;
    otp?: string;
    otpExpiry?: Date;
    isVerified?: boolean;
    lockoutUntil?: Date;
    failedLoginAttempts?: number;

    // Marketplace role — 'customer' is default, 'designer' set on registration, 'admin' set manually
    role: 'customer' | 'designer' | 'contractor' | 'vendor' | 'admin';

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

    // Preferences
    preferences?: {
        theme?: 'light' | 'dark' | 'system';
        currency?: 'INR' | 'USD';
        measurementUnit?: 'sqft' | 'sqm';
        defaultStyle?: string;
        autoVastu?: boolean;
        autoCost?: boolean;
        language?: 'en' | 'hi';
        emailNotifications?: boolean;
        marketingEmails?: boolean;
        showTips?: boolean;
    };

    // Metadata
    lastRenderAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
    clerkId: { type: String, index: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    otp: { type: String },
    otpExpiry: { type: Date },
    isVerified: { type: Boolean, default: false },
    lockoutUntil: { type: Date },
    failedLoginAttempts: { type: Number, default: 0 },
    role: { type: String, enum: ['customer', 'designer', 'admin', 'contractor', 'vendor'], default: 'customer' },
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

    preferences: {
        theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
        currency: { type: String, enum: ['INR', 'USD'], default: 'INR' },
        measurementUnit: { type: String, enum: ['sqft', 'sqm'], default: 'sqft' },
        defaultStyle: { type: String, default: 'modern' },
        autoVastu: { type: Boolean, default: true },
        autoCost: { type: Boolean, default: true },
        language: { type: String, enum: ['en', 'hi'], default: 'en' },
        emailNotifications: { type: Boolean, default: true },
        marketingEmails: { type: Boolean, default: false },
        showTips: { type: Boolean, default: true },
    },

    lastRenderAt: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Update the clerkId and updatedAt timestamp on save
UserSchema.pre('save', function (next) {
    if (!this.clerkId && this._id) {
        this.clerkId = this._id.toString();
    }
    this.updatedAt = new Date();
    next();
});

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
