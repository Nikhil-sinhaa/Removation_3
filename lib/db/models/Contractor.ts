// lib/db/models/Contractor.ts
import mongoose, { Schema, Model, Types } from 'mongoose';

// ── Specialty enum ────────────────────────────────────────────────────────────
export const CONTRACTOR_SPECIALTIES = [
    'painter',
    'carpenter',
    'electrician',
    'plumber',
    'modular-kitchen-installer',
] as const;

export type ContractorSpecialty = (typeof CONTRACTOR_SPECIALTIES)[number];

// ── Money sub-type ────────────────────────────────────────────────────────────
export interface IMoneyAmount {
    amount: number;   // in paise (₹1 = 100 paise)
    currency: string; // 'INR'
}

// ── Interface ─────────────────────────────────────────────────────────────────
export interface IContractor {
    userId: Types.ObjectId;
    displayName: string;
    bio?: string;
    phone: string;
    city: string;
    specialties: ContractorSpecialty[];
    portfolioImages: string[];
    yearsOfExperience?: number;

    isVerified: boolean;
    verifiedAt?: Date | null;
    verifiedBy?: Types.ObjectId | null;

    rejectionReason?: string | null;
    isActive: boolean;

    // Booking / pricing (mirrors Designer)
    consultationFee: IMoneyAmount;
    consultationDurationMinutes: number;
    projectMinFee: IMoneyAmount;
    acceptsConsultations: boolean;
    acceptsProjects: boolean;

    // Reviews / ratings
    averageRating: number;
    totalReviews: number;

    createdAt: Date;
    updatedAt: Date;
}

// ── Schema ────────────────────────────────────────────────────────────────────
const ContractorSchema = new Schema<IContractor>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
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
            enum: CONTRACTOR_SPECIALTIES,
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
        rejectionReason: {
            type: String,
            default: null,
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
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
        timestamps: true,
    }
);

ContractorSchema.index({ isVerified: 1, isActive: 1, city: 1 });

export const Contractor: Model<IContractor> =
    mongoose.models.Contractor || mongoose.model<IContractor>('Contractor', ContractorSchema);

export default Contractor;
