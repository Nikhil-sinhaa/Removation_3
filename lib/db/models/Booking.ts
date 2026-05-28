// lib/db/models/Booking.ts
//
// Represents a customer's booking of a designer for either a Consultation or a Project.
//
// State machine:
//   pending_payment → pending_designer → confirmed → completed  (happy path)
//                   ↘ rejected          (designer rejects — refund issued)
//                   ↘ cancelled_by_customer  (customer cancels before designer accepts — refund issued)
//                   ↘ expired           (designer didn't respond in 48h — refund issued)
//
// Money is stored in paise (₹1 = 100 paise) — same unit Razorpay uses natively.
// The pricing fields are snapshotted from the Designer doc at booking creation time
// so retroactive pricing changes do not affect existing bookings.

import mongoose, { Schema, Model, Types } from 'mongoose';

// ── Status enum ───────────────────────────────────────────────────────────────
export type BookingStatus =
    | 'pending_payment'       // order created, Razorpay not yet paid
    | 'pending_designer'      // paid, waiting for designer to accept (funds held)
    | 'confirmed'             // designer accepted
    | 'rejected'              // designer rejected — refund issued
    | 'cancelled_by_customer' // customer cancelled before designer accepted — refund issued
    | 'expired'               // designer didn't respond in 48h — refund issued
    | 'completed';            // future: after delivery

export const BOOKING_STATUSES: BookingStatus[] = [
    'pending_payment',
    'pending_designer',
    'confirmed',
    'rejected',
    'cancelled_by_customer',
    'expired',
    'completed',
];

// ── Booking type ──────────────────────────────────────────────────────────────
export type BookingType = 'consultation' | 'project';

// ── Interface ─────────────────────────────────────────────────────────────────
export interface IBooking {
    // Parties
    customerId: Types.ObjectId;  // ref: 'User'
    designerId: Types.ObjectId;  // ref: 'Designer'

    // Type
    type: BookingType;

    // Consultation-only fields (undefined when type === 'project')
    consultationSlot?: Date;              // booked date/time
    consultationDurationMinutes?: number; // snapshotted from Designer at booking time

    // Project-only fields (undefined when type === 'consultation')
    projectDescription?: string;          // customer's scope description (20–2000 chars)
    projectPreferredStartDate?: Date | null; // customer's preferred start, optional

    // Pricing snapshot — frozen at booking creation time
    amount: number;   // in paise
    currency: string; // default 'INR'

    // Status state machine
    status: BookingStatus;

    // Payment refs (populated progressively)
    razorpayOrderId: string | null;   // set at order creation
    razorpayPaymentId: string | null; // set at payment verify
    razorpaySignature: string | null; // set at payment verify
    paidAt: Date | null;
    refundedAt: Date | null;
    refundId: string | null; // Razorpay refund ref

    // Designer response
    designerAcceptedAt: Date | null;
    designerRejectedAt: Date | null;
    designerRejectionReason: string | null;
    designerResponseDeadline: Date; // set to paidAt + 48h when entering pending_designer

    // Customer side
    customerCancelledAt: Date | null;

    // Completion (added for Goal E)
    completedAt: Date | null;             // set when designer marks booking done
    reviewId: Types.ObjectId | null;      // ref: 'Review' — linked after customer reviews

    // Timestamps (Mongoose)
    createdAt: Date;
    updatedAt: Date;
}

// ── Schema ────────────────────────────────────────────────────────────────────
const BookingSchema = new Schema<IBooking>(
    {
        customerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        designerId: {
            type: Schema.Types.ObjectId,
            ref: 'Designer',
            required: true,
            index: true,
        },

        type: {
            type: String,
            enum: ['consultation', 'project'],
            required: true,
        },

        // ── Consultation-type fields ────────────────────────────────────────────
        consultationSlot: {
            type: Date,
            // Required when type === 'consultation'; enforced in pre-validate hook below
        },

        consultationDurationMinutes: {
            type: Number,
            min: [15, 'Duration must be at least 15 minutes'],
            max: [240, 'Duration cannot exceed 240 minutes'],
        },

        // ── Project-type fields ─────────────────────────────────────────────────
        projectDescription: {
            type: String,
            minlength: [20, 'Project description must be at least 20 characters'],
            maxlength: [2000, 'Project description cannot exceed 2000 characters'],
        },

        projectPreferredStartDate: {
            type: Date,
            default: null,
        },

        // ── Pricing snapshot ────────────────────────────────────────────────────
        amount: {
            type: Number,
            required: true,
            min: [1, 'Amount must be at least 1 paise'],
        },

        currency: {
            type: String,
            required: true,
            default: 'INR',
        },

        // ── Status ──────────────────────────────────────────────────────────────
        status: {
            type: String,
            enum: BOOKING_STATUSES,
            required: true,
            default: 'pending_payment',
        },

        // ── Payment refs ────────────────────────────────────────────────────────
        razorpayOrderId: {
            type: String,
            default: null,
        },

        razorpayPaymentId: {
            type: String,
            default: null,
        },

        razorpaySignature: {
            type: String,
            default: null,
        },

        paidAt: {
            type: Date,
            default: null,
        },

        refundedAt: {
            type: Date,
            default: null,
        },

        refundId: {
            type: String,
            default: null,
        },

        // ── Designer response ───────────────────────────────────────────────────
        designerAcceptedAt: {
            type: Date,
            default: null,
        },

        designerRejectedAt: {
            type: Date,
            default: null,
        },

        designerRejectionReason: {
            type: String,
            maxlength: [500, 'Rejection reason cannot exceed 500 characters'],
            default: null,
        },

        // Set to paidAt + 48 hours when transitioning to pending_designer
        designerResponseDeadline: {
            type: Date,
            required: true,
            // Default is a placeholder; the real value is always set by the API.
            // We need a non-null default so Mongoose doesn't reject on creation.
            default: () => new Date(Date.now() + 48 * 60 * 60 * 1000),
        },

        // ── Customer side ───────────────────────────────────────────────────────
        customerCancelledAt: {
            type: Date,
            default: null,
        },

        // ── Completion (added for Goal E) ────────────────────────────────────────
        completedAt: {
            type: Date,
            default: null,
        },

        reviewId: {
            type: Schema.Types.ObjectId,
            ref: 'Review',
            default: null,
        },
    },
    {
        timestamps: true, // createdAt & updatedAt managed by Mongoose
    }
);

// ── Cross-field validation (pre-validate hook) ─────────────────────────────────
// Ensures consultation and project fields are only set for the correct booking type.
BookingSchema.pre('validate', function (next) {
    if (this.type === 'consultation') {
        if (!this.consultationSlot) {
            return next(new Error('consultationSlot is required for consultation bookings'));
        }
        if (this.projectDescription) {
            return next(new Error('projectDescription must not be set for consultation bookings'));
        }
    }

    if (this.type === 'project') {
        if (!this.projectDescription) {
            return next(new Error('projectDescription is required for project bookings'));
        }
        if (this.consultationSlot) {
            return next(new Error('consultationSlot must not be set for project bookings'));
        }
    }

    next();
});

// ── Indexes ────────────────────────────────────────────────────────────────────
// Customer's booking history (most recent first)
BookingSchema.index({ customerId: 1, createdAt: -1 });

// Designer's incoming queue filtered by status
BookingSchema.index({ designerId: 1, status: 1, createdAt: -1 });

// Webhook / payment-verify lookup by Razorpay order (sparse = skip null entries)
BookingSchema.index({ razorpayOrderId: 1 }, { unique: true, sparse: true });

// Expiry-sweeper cron: find pending_designer bookings past their deadline
BookingSchema.index({ status: 1, designerResponseDeadline: 1 });

// ── Model ──────────────────────────────────────────────────────────────────────
export const Booking: Model<IBooking> =
    mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);

export default Booking;
