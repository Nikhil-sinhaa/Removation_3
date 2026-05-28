// lib/db/models/VendorInquiry.ts
import mongoose, { Schema, Model, Types } from 'mongoose';

export type InquiryStatus = 'pending' | 'responded' | 'closed';

// ── Interface ─────────────────────────────────────────────────────────────────
export interface IVendorInquiry {
    customerId: Types.ObjectId;
    vendorId: Types.ObjectId;
    message: string;
    phone?: string;
    email?: string;
    status: InquiryStatus;
    vendorResponse?: string | null;
    respondedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

// ── Schema ────────────────────────────────────────────────────────────────────
const VendorInquirySchema = new Schema<IVendorInquiry>(
    {
        customerId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        vendorId: {
            type: Schema.Types.ObjectId,
            ref: 'Vendor',
            required: true,
            index: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
            minlength: [10, 'Inquiry message must be at least 10 characters'],
            maxlength: [2000, 'Inquiry message cannot exceed 2000 characters'],
        },
        phone: {
            type: String,
            trim: true,
        },
        email: {
            type: String,
            trim: true,
        },
        status: {
            type: String,
            enum: ['pending', 'responded', 'closed'],
            default: 'pending',
            index: true,
        },
        vendorResponse: {
            type: String,
            default: null,
            maxlength: [2000, 'Response message cannot exceed 2000 characters'],
        },
        respondedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for vendor to quickly retrieve inquiries sorted by status and date
VendorInquirySchema.index({ vendorId: 1, status: 1, createdAt: -1 });
// Compound index for customer to view their inquiries
VendorInquirySchema.index({ customerId: 1, createdAt: -1 });

export const VendorInquiry: Model<IVendorInquiry> =
    mongoose.models.VendorInquiry || mongoose.model<IVendorInquiry>('VendorInquiry', VendorInquirySchema);

export default VendorInquiry;
