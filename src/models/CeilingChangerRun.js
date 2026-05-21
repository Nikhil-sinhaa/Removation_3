import mongoose from 'mongoose';

const ceilingChangerRunSchema = new mongoose.Schema({
  projectId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  colorName:      { type: String, required: true },
  hex:            { type: String, required: true },
  positivePrompt: { type: String },
  seed:           { type: Number },
  inputImageUrl:  { type: String },
  ceilingMaskUrl: { type: String },
  outputImageUrl: { type: String },
  comfyPromptIds: [{ type: String }],
  processingType: { type: String, default: 'ceiling-changer' },
  feedbackRating: { type: String, enum: ['up', 'down', null], default: null },
  feedbackText:   { type: String, default: null, maxlength: 1000 },
  feedbackAt:     { type: Date, default: null },
}, { timestamps: true });

ceilingChangerRunSchema.index({ projectId: 1 });
ceilingChangerRunSchema.index({ userId: 1 });

if (mongoose.models.CeilingChangerRun) delete mongoose.models.CeilingChangerRun;
const CeilingChangerRun = mongoose.model('CeilingChangerRun', ceilingChangerRunSchema);
export default CeilingChangerRun;
