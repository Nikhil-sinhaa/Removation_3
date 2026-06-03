import mongoose, { Schema, Document, Model } from 'mongoose';

export type PrivacyRequestType = 'export' | 'delete';
export type PrivacyRequestStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'rejected';

export interface IPrivacyRequest extends Document {
  userId:        mongoose.Types.ObjectId;
  userEmail:     string;
  userName:      string;
  type:          PrivacyRequestType;
  status:        PrivacyRequestStatus;
  reason?:       string;
  adminNotes?:   string;
  processedBy?:  mongoose.Types.ObjectId;
  processedAt?:  Date;
  exportUrl?:    string;
  exportExpiry?: Date;
  createdAt:     Date;
  updatedAt:     Date;
}

const PrivacyRequestSchema = new Schema<IPrivacyRequest>({
  userId:       { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  userEmail:    { type: String, required: true },
  userName:     { type: String, required: true },
  type:         { type: String, enum: ['export', 'delete'], required: true },
  status:       { type: String, enum: ['pending', 'processing', 'completed', 'rejected'], default: 'pending', index: true },
  reason:       { type: String },
  adminNotes:   { type: String },
  processedBy:  { type: Schema.Types.ObjectId, ref: 'User' },
  processedAt:  { type: Date },
  exportUrl:    { type: String },
  exportExpiry: { type: Date },
}, { timestamps: true });

PrivacyRequestSchema.index({ userId: 1, type: 1, status: 1 });

const PrivacyRequest: Model<IPrivacyRequest> =
  mongoose.models.PrivacyRequest ||
  mongoose.model<IPrivacyRequest>('PrivacyRequest', PrivacyRequestSchema);

export default PrivacyRequest;
