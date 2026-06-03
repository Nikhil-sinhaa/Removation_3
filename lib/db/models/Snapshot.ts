import mongoose, { Schema, Document, Model } from 'mongoose';

export type SnapshotTrigger =
  | 'manual_save'
  | 'auto_save'
  | 'render_complete'
  | 'before_generate'
  | 'restore';

export interface ISnapshot extends Document {
  projectId:    mongoose.Types.ObjectId;
  userId:       mongoose.Types.ObjectId;
  version:      number;
  label:        string;
  trigger:      SnapshotTrigger;
  data: {
    name?:         string;
    description?:  string;
    originalImage?: string;
    currentImage?:  string;
    roomType?:      string;
    style?:         string;
    tags?:          string[];
    isFavorite?:    boolean;
    isArchived?:    boolean;
    renders?:       string[];
    metadata?:      Record<string, unknown>;
  };
  thumbnailUrl?: string;
  isPinned:      boolean;
  sizeBytes?:    number;
  createdAt:     Date;
}

const SnapshotSchema = new Schema<ISnapshot>({
  projectId:    { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  userId:       { type: Schema.Types.ObjectId, ref: 'User',    required: true, index: true },
  version:      { type: Number,  required: true },
  label:        { type: String,  required: true },
  trigger:      { type: String,  required: true, enum: ['manual_save', 'auto_save', 'render_complete', 'before_generate', 'restore'] },
  data:         { type: Schema.Types.Mixed, required: true },
  thumbnailUrl: { type: String },
  isPinned:     { type: Boolean, default: false, index: true },
  sizeBytes:    { type: Number },
  createdAt:    { type: Date, default: Date.now, index: true },
}, { timestamps: false });

SnapshotSchema.index({ projectId: 1, version:   -1 });
SnapshotSchema.index({ projectId: 1, createdAt: -1 });
SnapshotSchema.index({ userId:    1, createdAt: -1 });

// TTL index: auto-expire non-pinned snapshots after 90 days
SnapshotSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 90 * 24 * 60 * 60,
    partialFilterExpression: { isPinned: false },
  }
);

const Snapshot: Model<ISnapshot> =
  mongoose.models['Snapshot'] ||
  mongoose.model<ISnapshot>('Snapshot', SnapshotSchema);

export default Snapshot;
