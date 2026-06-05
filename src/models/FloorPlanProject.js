import mongoose from 'mongoose';

const PhotoSchema = new mongoose.Schema({
  originalUrl:    { type: String, required: true },
  comfyFilename:  { type: String, required: true },
  width:          { type: Number },
  height:         { type: Number },
  order:          { type: Number },
  uploadedAt:     { type: Date, default: Date.now },
});

const PointCloudSchema = new mongoose.Schema({
  plyFilePath:      { type: String },  // path to .ply file
  pointCount:       { type: Number },
  boundingBox:      {
    min: { x: Number, y: Number, z: Number },
    max: { x: Number, y: Number, z: Number },
  },
  cameraPositions:  { type: Array, default: [] },
  generatedAt:      { type: Date },
});

const FloorPlanProjectSchema = new mongoose.Schema({
  userId:         { type: String },
  roomName:       { type: String, default: 'My Room' },

  // Phase 1
  photos:         [PhotoSchema],
  pointCloud:     PointCloudSchema,

  // Phase 2 (future — leave null for now)
  floorPlanData:  { type: mongoose.Schema.Types.Mixed, default: null },
  dxfFilePath:    { type: String, default: null },

  // Phase 3 (future)
  colorData: {
    wallColor:     { name: String, hex: String },
    ceilingColor:  { name: String, hex: String },
    furnitureRemoved: { type: Boolean, default: false },
  },

  status: {
    type: String,
    enum: [
      'photos_uploaded',
      'processing',
      'point_cloud_ready',
      'floor_plan_ready',
      'dxf_ready',
      'error'
    ],
    default: 'photos_uploaded'
  },

  errorMessage:   { type: String, default: null },
  processingLog:  { type: [String], default: [] },
}, {
  timestamps: true,
});

FloorPlanProjectSchema.index({ userId: 1 });
FloorPlanProjectSchema.index({ createdAt: -1 });

export default mongoose.models.FloorPlanProject ||
  mongoose.model('FloorPlanProject', FloorPlanProjectSchema);
