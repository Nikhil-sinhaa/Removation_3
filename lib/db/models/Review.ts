// lib/db/models/Review.ts
//
// Represents a customer's review of a designer after a completed booking.
//
// Rules:
//   - One review per booking (enforced by unique index on bookingId).
//   - Only the customer on the booking may create the review.
//   - Designer gets one chance to reply (designerReply is set once, immutable after).
//   - isVisible: admin can hide abusive reviews without deleting data.
//     Hidden reviews are excluded from averageRating aggregation.
//   - Rating is an integer 1–5 (no half-stars).

import mongoose, { Schema, Model, Types } from 'mongoose';

// ── Interface ─────────────────────────────────────────────────────────────────
export interface IReview {
    // References
    bookingId:  Types.ObjectId;  // ref: 'Booking' — unique (one review per booking)
    customerId: Types.ObjectId;  // ref: 'User'    — the reviewer
    designerId: Types.ObjectId;  // ref: 'Designer' — the reviewed designer

    // Review content
    rating:  number;        // integer 1–5, required
    title?:  string;        // optional, max 100 chars
    comment: string;        // required, 10–2000 chars

    // Designer reply (one-time)
    designerReply?:     string | null;
    designerRepliedAt?: Date | null;

    // Admin visibility gate
    isVisible: boolean;     // default true; set false to hide without deleting

    // Timestamps (Mongoose)
    createdAt: Date;
    updatedAt: Date;
}

// ── Schema ────────────────────────────────────────────────────────────────────
const ReviewSchema = new Schema<IReview>(
    {
        bookingId: {
            type: Schema.Types.ObjectId,
            ref: 'Booking',
            required: true,
        },

        customerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        designerId: {
            type: Schema.Types.ObjectId,
            ref: 'Designer',
            required: true,
        },

        rating: {
            type: Number,
            required: true,
            min: [1, 'Rating must be at least 1'],
            max: [5, 'Rating cannot exceed 5'],
            validate: {
                validator: (v: number) => Number.isInteger(v),
                message: 'Rating must be an integer (no half-stars)',
            },
        },

        title: {
            type: String,
            maxlength: [100, 'Title cannot exceed 100 characters'],
            trim: true,
        },

        comment: {
            type: String,
            required: true,
            minlength: [10, 'Comment must be at least 10 characters'],
            maxlength: [2000, 'Comment cannot exceed 2000 characters'],
            trim: true,
        },

        // Designer reply — set once, never overwritten
        designerReply: {
            type: String,
            maxlength: [1000, 'Designer reply cannot exceed 1000 characters'],
            default: null,
        },

        designerRepliedAt: {
            type: Date,
            default: null,
        },

        // Admin visibility gate
        isVisible: {
            type: Boolean,
            default: true,
            index: true,
        },
    },
    {
        timestamps: true, // createdAt & updatedAt managed by Mongoose
    }
);

// ── Indexes ───────────────────────────────────────────────────────────────────

// Primary listing index: all visible reviews for a designer, newest first
ReviewSchema.index({ designerId: 1, createdAt: -1 });

// Enforce one review per booking
ReviewSchema.index({ bookingId: 1 }, { unique: true });

// Customer review history
ReviewSchema.index({ customerId: 1 });

// ── Model ─────────────────────────────────────────────────────────────────────
export const Review: Model<IReview> =
    mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);

export default Review;
