import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotFoundLog extends Document {
  url:         string;
  referrer?:   string;
  userAgent?:  string;
  ip?:         string;
  hits:        number;
  firstSeenAt: Date;
  lastSeenAt:  Date;
  resolved:    boolean;
}

const NotFoundLogSchema = new Schema<INotFoundLog>({
  url:         { type: String, required: true, unique: true, index: true },
  referrer:    { type: String },
  userAgent:   { type: String },
  ip:          { type: String },
  hits:        { type: Number, default: 1 },
  firstSeenAt: { type: Date, default: Date.now },
  lastSeenAt:  { type: Date, default: Date.now, index: true },
  resolved:    { type: Boolean, default: false, index: true },
}, { timestamps: false });

// TTL — auto-purge resolved 404 logs after 90 days
NotFoundLogSchema.index(
  { lastSeenAt: 1 },
  {
    expireAfterSeconds: 90 * 24 * 60 * 60,
    partialFilterExpression: { resolved: true },
  }
);

const NotFoundLog: Model<INotFoundLog> =
  mongoose.models.NotFoundLog ||
  mongoose.model<INotFoundLog>('NotFoundLog', NotFoundLogSchema);

export default NotFoundLog;
