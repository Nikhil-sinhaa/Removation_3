import mongoose, { Schema, Document } from 'mongoose';

export interface ITourProgress extends Document {
  userId: string;
  tourId: string;
  isCompleted: boolean;
  isDismissed: boolean;
  currentStep: number;
  completedAt?: Date;
  dismissedAt?: Date;
}

const TourProgressSchema = new Schema<ITourProgress>(
  {
    userId: { type: String, required: true, index: true },
    tourId: { type: String, required: true },
    isCompleted: { type: Boolean, default: false },
    isDismissed: { type: Boolean, default: false },
    currentStep: { type: Number, default: 0 },
    completedAt: { type: Date },
    dismissedAt: { type: Date },
  },
  { timestamps: true }
);

TourProgressSchema.index({ userId: 1, tourId: 1 }, { unique: true });

export const TourProgress = mongoose.models.TourProgress || mongoose.model<ITourProgress>('TourProgress', TourProgressSchema);
