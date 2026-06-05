import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDismissedAnnouncement extends Document {
  userId:         mongoose.Types.ObjectId;
  announcementId: mongoose.Types.ObjectId;
  dismissedAt:    Date;
}

const DismissedAnnouncementSchema = new Schema<IDismissedAnnouncement>({
  userId:         { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  announcementId: { type: Schema.Types.ObjectId, ref: 'Announcement', required: true },
  dismissedAt:    { type: Date, default: Date.now },
}, { timestamps: false });

DismissedAnnouncementSchema.index(
  { userId: 1, announcementId: 1 },
  { unique: true }
);

// Auto-purge old dismissals after 90 days
DismissedAnnouncementSchema.index(
  { dismissedAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 }
);

const DismissedAnnouncement: Model<IDismissedAnnouncement> =
  mongoose.models.DismissedAnnouncement ||
  mongoose.model<IDismissedAnnouncement>('DismissedAnnouncement', DismissedAnnouncementSchema);

export default DismissedAnnouncement;
