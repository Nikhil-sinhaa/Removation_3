import mongoose from 'mongoose';

const styleTransferRunSchema = new mongoose.Schema({
  projectId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  stylePreset:    { type: String, required: true },
  positivePrompt: { type: String },
  negativePrompt: { type: String },
  seed:           { type: Number },
  inputImageUrl:  { type: String, required: true },
  styleImageUrl:  { type: String, required: true },
  outputImageUrl: { type: String },
  comfyPromptIds: [{ type: String }],
  feedbackRating: { type: String, enum: ['up', 'down', null], default: null },
  feedbackText:   { type: String, default: null, maxlength: 1000 },
  feedbackAt:     { type: Date, default: null },
}, { timestamps: true });

styleTransferRunSchema.index({ projectId: 1 });
styleTransferRunSchema.index({ userId: 1 });

if (mongoose.models.StyleTransferRun) {
  delete mongoose.models.StyleTransferRun;
}

const StyleTransferRun = mongoose.model('StyleTransferRun', styleTransferRunSchema);
export default StyleTransferRun;
