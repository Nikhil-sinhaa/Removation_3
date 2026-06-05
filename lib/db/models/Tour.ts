import mongoose, { Schema, Document } from 'mongoose';

export interface ITourStep {
  target: string;
  title: string;
  content: string;
  placement?: 'top' | 'right' | 'bottom' | 'left' | 'center';
  disableBackdrop?: boolean;
}

export interface ITour extends Document {
  id: string;
  name: string;
  description?: string;
  pages: string[];
  steps: ITourStep[];
  isActive: boolean;
  isDismissible: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

const TourSchema = new Schema<ITour>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String },
    pages: [{ type: String }],
    steps: [
      {
        target: { type: String, required: true },
        title: { type: String, required: true },
        content: { type: String, required: true },
        placement: { type: String, enum: ['top', 'right', 'bottom', 'left', 'center'], default: 'bottom' },
        disableBackdrop: { type: Boolean, default: false },
      }
    ],
    isActive: { type: Boolean, default: true },
    isDismissible: { type: Boolean, default: true },
    priority: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Tour = mongoose.models.Tour || mongoose.model<ITour>('Tour', TourSchema);
