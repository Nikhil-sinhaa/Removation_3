// lib/db/models/AdminConfig.ts
import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IAdminConfig {
    key: string;        // unique key e.g. 'app_mode', 'credit_costs'
    value: any;         // JSON value
    updatedBy?: Types.ObjectId | null; // admin who last changed it
    updatedAt: Date;
}

const AdminConfigSchema = new Schema<IAdminConfig>({
    key: { type: String, required: true, unique: true, index: true },
    value: { type: Schema.Types.Mixed, required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    updatedAt: { type: Date, default: Date.now },
});

// Update the updatedAt timestamp on save
AdminConfigSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

export const AdminConfig: Model<IAdminConfig> = mongoose.models.AdminConfig || mongoose.model<IAdminConfig>('AdminConfig', AdminConfigSchema);
export default AdminConfig;
