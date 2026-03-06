// lib/db/models/Render.ts
import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IRender {
    userId: Types.ObjectId;
    clerkId: string; // Added for webhook access
    projectId?: string;

    // Input/Output
    inputImage: string;
    outputImage?: string;
    resultUrl?: string; // Added for webhook compatibility
    outputUrls?: string[]; // Added for multiple outputs
    maskImage?: string;

    // Render configuration
    mode: 'redesign' | 'beautify' | 'creative' | 'furnish' | 'empty' | 'outdoor' | 'sketch' | 'enhance' | 'fill_room' | 'inpaint' | 'remove_object' | 'replace' | 'sketch_to_render';
    style?: string;
    roomType?: string;
    prompt?: string;
    settings?: Record<string, any>;

    // Status tracking
    status: 'processing' | 'completed' | 'failed' | 'queued' | 'canceled' | 'starting';
    error?: string;
    predictionId?: string; // Added for Replicate tracking
    logs?: string; // Added for debugging

    // Metadata
    variationIndex?: number;
    processingTime?: number;
    createdAt: Date;
    startedAt?: Date; // Added for tracking
    completedAt?: Date;
    updatedAt: Date;
}

const RenderSchema = new Schema<IRender>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    clerkId: { type: String, required: false, index: true },
    projectId: { type: String, index: true },

    inputImage: { type: String, required: true },
    outputImage: String,
    resultUrl: String,
    outputUrls: [String],
    maskImage: String,

    mode: {
        type: String,
        required: true,
        enum: ['redesign', 'beautify', 'creative', 'furnish', 'empty', 'outdoor', 'sketch', 'enhance', 'fill_room', 'inpaint', 'remove_object', 'replace', 'sketch_to_render']
    },
    style: String,
    roomType: String,
    prompt: String,
    settings: Schema.Types.Mixed,

    status: {
        type: String,
        required: true,
        enum: ['processing', 'completed', 'failed', 'queued', 'canceled', 'starting'],
        default: 'queued'
    },
    error: String,
    predictionId: { type: String, index: true },
    logs: String,

    variationIndex: Number,
    processingTime: Number,
    createdAt: { type: Date, default: Date.now, index: true },
    startedAt: Date,
    completedAt: Date,
    updatedAt: { type: Date, default: Date.now },
});

// Update the updatedAt timestamp on save
RenderSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// Index for efficient queries
RenderSchema.index({ userId: 1, createdAt: -1 });
RenderSchema.index({ clerkId: 1, createdAt: -1 });
RenderSchema.index({ status: 1, createdAt: -1 });
RenderSchema.index({ predictionId: 1 });

export const Render: Model<IRender> = mongoose.models.Render || mongoose.model<IRender>('Render', RenderSchema);
export default Render;
