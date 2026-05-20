import mongoose from 'mongoose';

const roomChangerRunSchema = new mongoose.Schema({
  projectId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  colorName:      { type: String, required: true },
  hex:            { type: String, required: true },
  positivePrompt: { type: String },
  seed:           { type: Number },
  inputImageUrl:  { type: String },
  wallMaskUrl:    { type: String },
  floorMaskUrl:   { type: String },
  objectMaskUrl:  { type: String },
  emptyMaskUrl:   { type: String },
  depthMapUrl:    { type: String },
  outputImageUrl: { type: String },
  comfyPromptIds: [{ type: String }],
  // Stored so Stage 3 can be retried without re-running Stage 1
  stage1Outputs:  { type: mongoose.Schema.Types.Mixed },
  stage1Completed:{ type: Boolean, default: false },
}, { timestamps: true });

roomChangerRunSchema.index({ projectId: 1 });
roomChangerRunSchema.index({ userId: 1 });

if (mongoose.models.RoomChangerRun) delete mongoose.models.RoomChangerRun;
const RoomChangerRun = mongoose.model('RoomChangerRun', roomChangerRunSchema);
export default RoomChangerRun;
