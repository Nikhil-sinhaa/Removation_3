import mongoose, { Schema, Document, Model } from 'mongoose';

export type TaggableType = 'project' | 'render' | 'designer';

export interface ITagging extends Document {
  tagId:        mongoose.Types.ObjectId;
  taggableType: TaggableType;
  taggableId:   mongoose.Types.ObjectId;
  userId:       mongoose.Types.ObjectId;
  createdAt:    Date;
}

const TaggingSchema = new Schema<ITagging>({
  tagId:        { type: Schema.Types.ObjectId, ref: 'Tag', required: true, index: true },
  taggableType: { type: String, enum: ['project','render','designer'], required: true },
  taggableId:   { type: Schema.Types.ObjectId, required: true, index: true },
  userId:       { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

TaggingSchema.index({ tagId: 1, taggableType: 1, taggableId: 1 }, { unique: true });
TaggingSchema.index({ taggableType: 1, taggableId: 1 });
TaggingSchema.index({ userId: 1, taggableType: 1 });

const Tagging: Model<ITagging> =
  mongoose.models.Tagging ||
  mongoose.model<ITagging>('Tagging', TaggingSchema);

export default Tagging;
