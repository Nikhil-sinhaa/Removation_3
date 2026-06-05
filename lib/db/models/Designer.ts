// lib/db/models/Designer.ts
import mongoose, { Schema, Model, Types } from 'mongoose';

// ── Specialty enum ────────────────────────────────────────────────────────────
// Add new specialties here as the marketplace grows.
// These are the display-safe slug values stored in the DB.
export const DESIGNER_SPECIALTIES = [
    'modular-kitchen',
    'bedroom',
    'living-room',
    'bathroom',
    'office',
    'vastu',
    'luxury',
    'budget',
    'minimalist',
    'traditional',
    'contemporary',
    'kids-room',
    'renovation',
    'lighting-design',
    '3d-visualization',
] as const;

export type DesignerSpecialty = (typeof DESIGNER_SPECIALTIES)[number];

// ── Money sub-type ────────────────────────────────────────────────────────────
export interface IMoneyAmount {
    amount: number;   // in paise (₹1 = 100 paise) — avoids float arithmetic issues
    currency: string; // 'INR'
}

// ── Interface ─────────────────────────────────────────────────────────────────
export interface IDesigner {
    // Ownership — unique per user
    userId: Types.ObjectId;

    // Public profile
    displayName: string;
    bio?: string;
    phone: string; // stored as string to preserve +country codes and leading zeros
    city: string;
    specialties: DesignerSpecialty[];
    portfolioImages: string[]; // max 10 URLs
    yearsOfExperience?: number;

    // Verification gate — controls public listing
    isVerified: boolean;
    verifiedAt?: Date | null;
    verifiedBy?: Types.ObjectId | null; // admin userId who approved

    // Rejection
    rejectionReason?: string | null;

    // Soft-delete (separate from verification)
    isActive: boolean;

    // ── Booking / pricing (added for Goal A) ──────────────────────────────────
    // Amount stored in paise (Indian smallest unit) to avoid float-point issues.
    // Razorpay also expects paise natively.
    consultationFee: IMoneyAmount;      // per-session fee for 1-hour consultations
    consultationDurationMinutes: number; // duration, default 60
    projectMinFee: IMoneyAmount;         // designer's minimum quote for a project
    acceptsConsultations: boolean;       // toggle — hides from consultation booking if false
    acceptsProjects: boolean;            // toggle — hides from project booking if false

    // ── Reviews / ratings (added for Goal E) ──────────────────────────────────
    // Denormalized counters — updated by POST /api/reviews on review creation.
    // Avoids running aggregation on every listing/detail page load.
    averageRating: number;  // 0 when no reviews; rounded to 1 decimal
    totalReviews:  number;  // raw count of visible reviews

    // Timestamps (injected by Mongoose when timestamps: true)
    createdAt: Date;
    updatedAt: Date;
}

// ── Schema ────────────────────────────────────────────────────────────────────
const DesignerSchema = new Schema<IDesigner>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true, // one designer profile per user
            index: true,
        },

        displayName: {
            type: String,
            required: true,
            trim: true,
        },

        bio: {
            type: String,
            maxlength: [1000, 'Bio must be 1000 characters or fewer'],
        },

        phone: {
            type: String,
            required: true,
            trim: true,
        },

        city: {
            type: String,
            required: true,
            trim: true,
        },

        specialties: {
            type: [String],
            enum: DESIGNER_SPECIALTIES,
            default: [],
        },

        portfolioImages: {
            type: [String],
            validate: {
                validator: (arr: string[]) => arr.length <= 10,
                message: 'A maximum of 10 portfolio images is allowed',
            },
            default: [],
        },

        yearsOfExperience: {
            type: Number,
            min: [0, 'Years of experience cannot be negative'],
            max: [60, 'Years of experience cannot exceed 60'],
        },

        // Verification gate
        isVerified: {
            type: Boolean,
            default: false,
            index: true,
        },
        verifiedAt: {
            type: Date,
            default: null,
        },
        verifiedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },

        // Rejection
        rejectionReason: {
            type: String,
            default: null,
        },

        // Soft-delete — separate concern from verification
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },

        // ── Booking / pricing fields ──────────────────────────────────────────
        // Snapshot-able: when a booking is created, these values are copied onto
        // the Booking doc so retroactive price changes don't break old bookings.

        consultationFee: {
            amount: {
                type: Number,
                default: 0,
                min: [0, 'Consultation fee cannot be negative'],
                max: [10_000_000, 'Consultation fee cannot exceed ₹1,00,000'],
            },
            currency: {
                type: String,
                default: 'INR',
            },
        },

        consultationDurationMinutes: {
            type: Number,
            default: 60,
            min: [15, 'Consultation duration must be at least 15 minutes'],
            max: [240, 'Consultation duration cannot exceed 240 minutes'],
        },

        projectMinFee: {
            amount: {
                type: Number,
                default: 0,
                min: [0, 'Project minimum fee cannot be negative'],
                max: [10_000_000, 'Project minimum fee cannot exceed ₹1,00,000'],
            },
            currency: {
                type: String,
                default: 'INR',
            },
        },

        acceptsConsultations: {
            type: Boolean,
            default: true,
        },

        acceptsProjects: {
            type: Boolean,
            default: true,
        },

        // ── Review counters ───────────────────────────────────────────────
        // Updated atomically by POST /api/reviews via $avg aggregation.
        // Do NOT edit these manually; they are recalculated on each new review.
        averageRating: {
            type: Number,
            default: 0,
            min: [0, 'Average rating cannot be negative'],
            max: [5, 'Average rating cannot exceed 5'],
        },

        totalReviews: {
            type: Number,
            default: 0,
            min: [0, 'Total reviews cannot be negative'],
        },
    },
    {
        timestamps: true, // createdAt & updatedAt managed by Mongoose
    }
);

// ── Compound index for the public listing query ────────────────────────────────
// Powers: Designer.find({ isVerified: true, isActive: true, city: <city> })
DesignerSchema.index({ isVerified: 1, isActive: 1, city: 1 });

// ── Model ─────────────────────────────────────────────────────────────────────
export const Designer: Model<IDesigner> =
    mongoose.models.Designer || mongoose.model<IDesigner>('Designer', DesignerSchema);

export default Designer;
