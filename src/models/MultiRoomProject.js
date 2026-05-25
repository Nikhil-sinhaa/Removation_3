import mongoose from 'mongoose';

const PaintedPhotoSchema = new mongoose.Schema({
  originalUrl:   { type: String, required: true },
  paintedUrl:    { type: String, default: null },
  comfyFilename: { type: String },
  // Sub-Project _id created for each Room Changer run
  subProjectId:  { type: String, default: null },
  status: {
    type: String,
    enum: ['queued', 'processing', 'done', 'error'],
    default: 'queued',
  },
  order:          { type: Number },
  marbleAssetId:  { type: String, default: null },
  errorMessage:   { type: String, default: null },
});

const MultiRoomProjectSchema = new mongoose.Schema({
  userId:   { type: String },
  roomName: { type: String, default: 'My Room' },
  colorName: { type: String, required: true },
  colorHex:  { type: String, required: true },

  photos: [PaintedPhotoSchema],

  // Painting status
  paintingStatus: {
    type: String,
    enum: ['idle', 'painting', 'painted', 'error'],
    default: 'idle',
  },
  paintedCount: { type: Number, default: 0 },
  totalCount:   { type: Number, default: 0 },

  // Marble 3D generation
  marbleStatus: {
    type: String,
    enum: ['idle', 'uploading', 'generating', 'done', 'error', 'cancelled'],
    default: 'idle',
  },
  marbleOperationId: { type: String, default: null },
  marbleWorldId:     { type: String, default: null },
  marbleWorldUrl:    { type: String, default: null },
  marbleThumbnail:   { type: String, default: null },

  errorMessage: { type: String, default: null },
}, { timestamps: true });

MultiRoomProjectSchema.index({ userId: 1, createdAt: -1 });
MultiRoomProjectSchema.index({ paintingStatus: 1 });
MultiRoomProjectSchema.index({ marbleStatus: 1 });

if (mongoose.models.MultiRoomProject) delete mongoose.models.MultiRoomProject;
const MultiRoomProject = mongoose.model('MultiRoomProject', MultiRoomProjectSchema);

export default MultiRoomProject;
