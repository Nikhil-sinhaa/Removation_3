import mongoose, { Schema, Document, Model } from 'mongoose';

export type TaskStatus = 'idle' | 'running' | 'success' | 'failed' | 'disabled';
export type TaskId =
  | 'purge.old.renders'
  | 'purge.audit.logs'
  | 'purge.expired.exports'
  | 'cloudinary.cleanup'
  | 'subscription.renewal.reminders'
  | 'subscription.expiry.check'
  | 'send.weekly.digest'
  | 'redis.cache.flush'
  | 'render.stuck.cleanup'
  | 'db.stats.snapshot'
  | 'purge.404.logs';

export interface IScheduledTask extends Document {
  taskId:           TaskId;
  name:             string;
  description:      string;
  cronExpression:   string;
  enabled:          boolean;
  status:           TaskStatus;
  lastRunAt?:       Date;
  lastRunResult?:   string;
  lastRunDuration?: number;
  nextRunAt?:       Date;
  runCount:         number;
  failCount:        number;
  createdAt:        Date;
  updatedAt:        Date;
}

const ScheduledTaskSchema = new Schema<IScheduledTask>({
  taskId:           { type: String, required: true, unique: true, index: true },
  name:             { type: String, required: true },
  description:      { type: String, required: true },
  cronExpression:   { type: String, required: true },
  enabled:          { type: Boolean, default: true },
  status:           { type: String, enum: ['idle', 'running', 'success', 'failed', 'disabled'], default: 'idle' },
  lastRunAt:        { type: Date },
  lastRunResult:    { type: String },
  lastRunDuration:  { type: Number },
  nextRunAt:        { type: Date },
  runCount:         { type: Number, default: 0 },
  failCount:        { type: Number, default: 0 },
}, { timestamps: true });

const ScheduledTask: Model<IScheduledTask> =
  mongoose.models.ScheduledTask ||
  mongoose.model<IScheduledTask>('ScheduledTask', ScheduledTaskSchema);

export default ScheduledTask;
