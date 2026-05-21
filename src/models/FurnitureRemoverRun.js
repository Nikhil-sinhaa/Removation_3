import mongoose from 'mongoose';

const furnitureRemoverRunSchema = new mongoose.Schema({
  projectId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  inputImageUrl:  { type: String },
  outputImageUrl: { type: String },
  comfyPromptIds: [{ type: String }],
  feedbackRating: { type: String, enum: ['up', 'down', null], default: null },
  feedbackText:   { type: String, default: null, maxlength: 1000 },
  feedbackAt:     { type: Date, default: null },
}, { timestamps: true });

furnitureRemoverRunSchema.index({ projectId: 1 });
furnitureRemoverRunSchema.index({ userId: 1 });

if (mongoose.models.FurnitureRemoverRun) delete mongoose.models.FurnitureRemoverRun;
const FurnitureRemoverRun = mongoose.model('FurnitureRemoverRun', furnitureRemoverRunSchema);
export default FurnitureRemoverRun;
