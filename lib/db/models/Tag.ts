import mongoose, { Schema, Document, Model } from 'mongoose';

export type TagCategory =
  | 'room_type'
  | 'style'
  | 'project'
  | 'status'
  | 'color'
  | 'custom';

export interface ITag extends Document {
  slug:        string;
  label:       string;
  color:       string;
  parentId?:   mongoose.Types.ObjectId;
  path:        string;
  userId?:     mongoose.Types.ObjectId;
  isGlobal:    boolean;
  usageCount:  number;
  category:    TagCategory;
  createdAt:   Date;
  updatedAt:   Date;
}

const TagSchema = new Schema<ITag>({
  slug:       { type: String, required: true, index: true },
  label:      { type: String, required: true },
  color:      { type: String, default: '#8B5CF6' },
  parentId:   { type: Schema.Types.ObjectId, ref: 'Tag' },
  path:       { type: String, default: '' },
  userId:     { type: Schema.Types.ObjectId, ref: 'User', index: true },
  isGlobal:   { type: Boolean, default: false, index: true },
  usageCount: { type: Number, default: 0 },
  category:   { type: String, enum: ['room_type','style','project','status','color','custom'], default: 'custom' },
}, { timestamps: true });

TagSchema.index({ slug: 1, userId: 1 }, { unique: true });
TagSchema.index({ isGlobal: 1, category: 1 });

const Tag: Model<ITag> =
  mongoose.models.Tag ||
  mongoose.model<ITag>('Tag', TagSchema);

export default Tag;
