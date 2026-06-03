import mongoose, { Schema, Document, Model } from 'mongoose';

export type RedirectType   = 301 | 302;
export type RedirectStatus = 'enabled' | 'disabled';

export interface IRedirect extends Document {
  sourceUrl:   string;
  destUrl:     string;
  statusCode:  RedirectType;
  status:      RedirectStatus;
  hits:        number;
  hitAt?:      Date;
  origin:      'manual' | 'from_404';
  referrer?:   string;
  comment?:    string;
  createdAt:   Date;
  updatedAt:   Date;
}

const RedirectSchema = new Schema<IRedirect>({
  sourceUrl:  { type: String, required: true, unique: true, index: true },
  destUrl:    { type: String, required: true },
  statusCode: { type: Number, enum: [301, 302], default: 301 },
  status:     { type: String, enum: ['enabled', 'disabled'], default: 'enabled', index: true },
  hits:       { type: Number, default: 0 },
  hitAt:      { type: Date },
  origin:     { type: String, enum: ['manual', 'from_404'], default: 'manual' },
  referrer:   { type: String },
  comment:    { type: String },
}, { timestamps: true });

const Redirect: Model<IRedirect> =
  mongoose.models.Redirect ||
  mongoose.model<IRedirect>('Redirect', RedirectSchema);

export default Redirect;
