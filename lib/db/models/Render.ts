// lib/db/models/Render.ts
import mongoose, { Schema, Model, Types } from 'mongoose';
import { FEEDBACK_TAGS, FeedbackTag } from '@/lib/constants/feedbackTags';

// Re-export so existing server-side importers of this module still work.
export { FEEDBACK_TAGS };
export type { FeedbackTag };

// ── Admin feedback thread ─────────────────────────────────────────────────────
export interface IAdminNote {
    _id: Types.ObjectId;
    authorId: Types.ObjectId;   // ref: 'User'
    authorName: string;          // denormalised display name
    text: string;
    createdAt: Date;
}

// ── Queue job state machine ──────────────────────────────────────────────────

export const JOB_STATUSES = {
  PENDING:    'pending',     // created, not yet queued
  QUEUED:     'queued',      // in Redis queue, waiting
  PROCESSING: 'processing',  // ComfyUI is running it right now
  COMPLETED:  'completed',   // done
  FAILED:     'failed',      // ComfyUI errored or timed out
  CANCELLED:  'cancelled',   // user cancelled or credit refunded
} as const;

export type JobStatus = typeof JOB_STATUSES[keyof typeof JOB_STATUSES];


export interface IRender {
    userId: Types.ObjectId;
    clerkId: string; // Added for webhook access
    projectId?: string;

    // Input/Output
    inputImage: string; // Local file path or URL
    outputImage?: string; // Local file path to generated image
    resultUrl?: string; // Added for webhook compatibility
    outputUrls?: string[]; // Added for multiple outputs
    maskImage?: string;
    
    // ComfyUI specific fields
    originalImagePath?: string; // Original uploaded file path
    generatedImagePath?: string; // Local path to generated image
    promptId?: string; // ComfyUI prompt ID for tracking

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

    // Feedback
    rating?: number | null;
    feedbackTags?: string[];
    feedbackComment?: string;
    feedbackSubmittedAt?: Date | null;

    // Metadata
    variationIndex?: number;
    processingTime?: number;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    updatedAt: Date;

    // Queue tracking fields — added for AI generation queue system
    featureType?: string;
    jobId?: string;
    queuePosition?: number | null;
    jobStatus?: JobStatus;
    processingStartedAt?: Date | null;
    estimatedWaitSeconds?: number | null;
    queuedAt?: Date | null;

    // Admin-internal notes thread (staff-only, never shown to customers)
    adminNotes?: IAdminNote[];
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
    
    // ComfyUI specific fields
    originalImagePath: String,
    generatedImagePath: String,
    promptId: { type: String, index: true },

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

    // Feedback
    rating: { type: Number, min: 1, max: 5, default: null, index: true },
    feedbackTags: { type: [String], default: [] },
    feedbackComment: { type: String, default: '', maxlength: 500 },
    feedbackSubmittedAt: { type: Date, default: null },

    variationIndex: Number,
    processingTime: Number,
    createdAt: { type: Date, default: Date.now, index: true },
    startedAt: Date,
    completedAt: Date,
    updatedAt: { type: Date, default: Date.now },

    // Queue tracking fields
    featureType: { type: String, default: null },
    jobId: { type: String, default: null, index: true, sparse: true },
    queuePosition: { type: Number, default: null },
    jobStatus: {
        type: String,
        enum: ['pending', 'queued', 'processing', 'completed', 'failed', 'cancelled'],
        default: null,
        index: true,
    },
    processingStartedAt: { type: Date, default: null },
    estimatedWaitSeconds: { type: Number, default: null },
    queuedAt: { type: Date, default: null },

    // Admin-internal notes thread
    adminNotes: {
        type: [{
            authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
            authorName: { type: String, required: true },
            text: { type: String, required: true, maxlength: 2000 },
            createdAt: { type: Date, default: Date.now },
        }],
        default: [],
    },
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
