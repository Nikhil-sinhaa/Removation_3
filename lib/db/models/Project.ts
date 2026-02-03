// lib/db/models/Project.ts
import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IProject {
    userId: Types.ObjectId;
    name: string;
    description?: string;

    // Project data
    originalImage?: string;
    currentImage?: string;
    roomType?: string;
    style?: string;

    // Associated renders
    renders: Types.ObjectId[];

    // Metadata
    tags?: string[];
    isFavorite: boolean;
    isArchived: boolean;
    lastActivity: Date;
    createdAt: Date;
    updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    description: String,

    originalImage: String,
    currentImage: String,
    roomType: String,
    style: String,

    renders: [{ type: Schema.Types.ObjectId, ref: 'Render' }],

    tags: [String],
    isFavorite: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    lastActivity: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Update timestamps
ProjectSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// Indexes
ProjectSchema.index({ userId: 1, lastActivity: -1 });
ProjectSchema.index({ userId: 1, isFavorite: 1 });

export const Project: Model<IProject> = mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);
export default Project;
