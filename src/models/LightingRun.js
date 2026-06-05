import mongoose from 'mongoose';

const lightingRunSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  clerkId: { type: String },
  inputImageUrl: { type: String, required: true },
  scene: { type: String, required: true },
  manualPrompt: { type: String },
  workflow: { type: String, enum: ['01_circle', '08_4dir'], required: true },
  lightX: { type: Number },
  lightY: { type: Number },
  lightRadius: { type: Number },
  lightIntensity: { type: Number },
  lightColor: { type: String },
  icMultiplier: { type: Number },
  results: [{
    label: { type: String, required: true },
    url: { type: String, required: true }
  }],
  isBatch: { type: Boolean, default: false },
  status: { type: String, enum: ['processing', 'completed', 'failed'], default: 'processing' }
}, { timestamps: true });

lightingRunSchema.index({ projectId: 1 });
lightingRunSchema.index({ userId: 1 });

if (mongoose.models.LightingRun) delete mongoose.models.LightingRun;
const LightingRun = mongoose.model('LightingRun', lightingRunSchema);
export default LightingRun;
