import mongoose, { Schema, Document, Model } from 'mongoose';

export type AnnouncementType =
  | 'info'
  | 'warning'
  | 'success'
  | 'promotion'
  | 'maintenance';

export type AnnouncementTarget =
  | 'all'
  | 'free'
  | 'pro'
  | 'teams'
  | 'designers'
  | 'contractors'
  | 'new_users';

export interface IAnnouncement extends Document {
  title:         string;
  message:       string;
  ctaLabel?:     string;
  ctaUrl?:       string;
  type:          AnnouncementType;
  icon?:         string;
  isDismissable: boolean;
  target:        AnnouncementTarget;
  startsAt:      Date;
  endsAt?:       Date;
  isActive:      boolean;
  impressions:   number;
  dismissals:    number;
  ctaClicks:     number;
  createdBy:     mongoose.Types.ObjectId;
  createdAt:     Date;
  updatedAt:     Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>({
  title:         { type: String, required: true },
  message:       { type: String, required: true },
  ctaLabel:      { type: String },
  ctaUrl:        { type: String },
  type: {
    type:    String,
    enum:    ['info', 'warning', 'success', 'promotion', 'maintenance'],
    default: 'info',
  },
  icon:          { type: String },
  isDismissable: { type: Boolean, default: true },
  target: {
    type:    String,
    enum:    ['all', 'free', 'pro', 'teams', 'designers', 'contractors', 'new_users'],
    default: 'all',
  },
  startsAt:    { type: Date, default: Date.now, index: true },
  endsAt:      { type: Date },
  isActive:    { type: Boolean, default: true, index: true },
  impressions: { type: Number, default: 0 },
  dismissals:  { type: Number, default: 0 },
  ctaClicks:   { type: Number, default: 0 },
  createdBy:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

AnnouncementSchema.index({ isActive: 1, startsAt: 1, endsAt: 1 });

const Announcement: Model<IAnnouncement> =
  mongoose.models['Announcement'] ||
  mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);

export default Announcement;
