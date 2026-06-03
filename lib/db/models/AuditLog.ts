// lib/db/models/AuditLog.ts
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuditLog extends Document {
  // Who
  adminId: mongoose.Types.ObjectId;
  adminName: string;
  adminEmail: string;
  adminIp: string;

  // What
  action: AuditAction;
  category: AuditCategory;

  // Which entity was affected
  targetType: 'user' | 'designer' | 'contractor' | 'vendor' | 'render' | 'subscription' | 'system';
  targetId?: string;
  targetName?: string; // e.g. the user's name/email for display

  // Detail
  description: string;         // human-readable: "Banned user john@example.com"
  metadata?: Record<string, unknown>; // any extra data

  // When
  createdAt: Date;
}

export type AuditAction =
  | 'user.ban'
  | 'user.unban'
  | 'user.suspend'
  | 'user.delete'
  | 'user.credits.add'
  | 'user.credits.deduct'
  | 'user.role.change'
  | 'user.plan.change'
  | 'designer.approve'
  | 'designer.reject'
  | 'contractor.approve'
  | 'contractor.reject'
  | 'vendor.approve'
  | 'vendor.reject'
  | 'render.delete'
  | 'render.flag'
  | 'render.unflag'
  | 'subscription.cancel'
  | 'subscription.refund'
  | 'system.gpu.mode.change'
  | 'system.app.mode.change'
  | 'system.config.change'
  | 'admin.login'
  | 'admin.logout';

export type AuditCategory =
  | 'users'
  | 'designers'
  | 'contractors'
  | 'vendors'
  | 'renders'
  | 'subscriptions'
  | 'system'
  | 'auth';

const AuditLogSchema = new Schema<IAuditLog>(
  {
    adminId:     { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    adminName:   { type: String, required: true },
    adminEmail:  { type: String, required: true },
    adminIp:     { type: String, default: 'unknown' },
    action:      { type: String, required: true, index: true },
    category:    { type: String, required: true, index: true },
    targetType:  { type: String, required: true },
    targetId:    { type: String, index: true },
    targetName:  { type: String },
    description: { type: String, required: true },
    metadata:    { type: Schema.Types.Mixed },
    createdAt:   { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: false, // we manage createdAt manually
  }
);

// Compound indexes for common query patterns
AuditLogSchema.index({ adminId: 1, createdAt: -1 });
AuditLogSchema.index({ category: 1, createdAt: -1 });
AuditLogSchema.index({ targetId: 1, createdAt: -1 });

// Auto-purge logs older than 365 days
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

export default AuditLog;
