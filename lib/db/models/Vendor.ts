// lib/db/models/Vendor.ts
import mongoose, { Schema, Model, Types } from 'mongoose';

// ── Specialty enum ────────────────────────────────────────────────────────────
export const VENDOR_SPECIALTIES = [
    'tile-shop',
    'paint-store',
    'furniture-seller',
    'hardware-store',
] as const;

export type VendorSpecialty = (typeof VENDOR_SPECIALTIES)[number];

// ── Interface ─────────────────────────────────────────────────────────────────
export interface IVendor {
    userId: Types.ObjectId;
    displayName: string;
    bio?: string;
    phone: string;
    city: string;
    storeAddress: string;
    website?: string;           // optional store/brand website URL
    yearsOfExperience?: number; // years the store has been in business
    specialties: VendorSpecialty[];
    portfolioImages: string[]; // store/materials showcase photos (max 10)

    isVerified: boolean;
    verifiedAt?: Date | null;
    verifiedBy?: Types.ObjectId | null;

    rejectionReason?: string | null;
    isActive: boolean;

    createdAt: Date;
    updatedAt: Date;
}

// ── Schema ────────────────────────────────────────────────────────────────────
const VendorSchema = new Schema<IVendor>(
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
        storeAddress: {
            type: String,
            required: true,
            trim: true,
            maxlength: [500, 'Store address must be 500 characters or fewer'],
        },
        website: {
            type: String,
            trim: true,
            maxlength: [500, 'Website URL must be 500 characters or fewer'],
        },
        yearsOfExperience: {
            type: Number,
            min: [0, 'Years of experience cannot be negative'],
            max: [100, 'Years of experience value seems too high'],
        },
        specialties: {
            type: [String],
            enum: VENDOR_SPECIALTIES,
            default: [],
        },
        portfolioImages: {
            type: [String],
            validate: {
                validator: (arr: string[]) => arr.length <= 10,
                message: 'A maximum of 10 portfolio images/store photos is allowed',
            },
            default: [],
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
    },
    {
        timestamps: true,
    }
);

VendorSchema.index({ isVerified: 1, isActive: 1, city: 1 });

export const Vendor: Model<IVendor> =
    mongoose.models.Vendor || mongoose.model<IVendor>('Vendor', VendorSchema);

export default Vendor;
