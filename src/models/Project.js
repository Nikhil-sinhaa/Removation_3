/**
 * Mongoose Project Model for Removation.ai
 * Stores AI project data and processing status
 */

import mongoose from 'mongoose';

const aiConfigSchema = new mongoose.Schema({
  style: {
    type: String,
    required: false
  },
  roomType: {
    type: String,
    required: false
  },
  colorPalette: {
    type: String,
    required: false
  },
  objectTarget: {
    type: String,
    required: false
  },
  seed: {
    type: Number,
    required: false
  },
  target: {
    type: String,
    enum: ['walls', 'ceiling', 'floor', 'furniture', 'all'],
    required: false
  },
  color: {
    type: String,
    required: false
  },
  material: {
    type: String,
    required: false
  },
  objectName: {
    type: String,
    required: false
  },
  masterSelector: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  masterToggles: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  useControlNet: {
    type: Boolean,
    required: false
  },
  furnitureImage: {
    type: String,
    required: false
  },
  skipStages: {
    type: [Number],
    required: false
  }
}, { _id: false });

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    default: () => `AI Project ${new Date().toLocaleDateString()}`
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false  // Made optional for testing
  },
  originalImage: {
    type: String,
    required: true
  },
  resultImage: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['queued', 'processing', 'completed', 'failed'],
    default: 'queued'
  },
  aiConfig: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  comfyPromptId: {
    type: String,
    required: false
  },
  processingType: {
    type: String,
    enum: [
      'redesign', 'object_removal', 'recolor', 'ultra-pro',
      'tab-render', 'tab-edit', 'tab-furnish', 'tab-lighting', 'tab-postprocess',
      'tool-auto-edit', 'tool-empty-room', 'tool-point-edit',
      'tool-interior-render', 'tool-exterior-render', 'tool-landscape',
      'tool-style-transfer', 'tool-collage',
      'tool-background', 'tool-view-extend', 'tool-lineart',
    ],
    required: true
  },
  errorMessage: {
    type: String,
    default: null
  },
  processingStartedAt: {
    type: Date,
    default: null
  },
  processingCompletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
projectSchema.index({ userId: 1, createdAt: -1 });
projectSchema.index({ status: 1 });
projectSchema.index({ comfyPromptId: 1 });
projectSchema.index({ processingType: 1 });

// Pre-save middleware to set timestamps
projectSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'processing' && !this.processingStartedAt) {
    this.processingStartedAt = new Date();
  }
  
  if (this.isModified('status') && (this.status === 'completed' || this.status === 'failed') && !this.processingCompletedAt) {
    this.processingCompletedAt = new Date();
  }
  
  next();
});

// Static methods
projectSchema.statics.findByUserId = function(userId) {
  return this.find({ userId }).sort({ createdAt: -1 });
};

projectSchema.statics.findQueuedProjects = function() {
  return this.find({ status: 'queued' }).sort({ createdAt: 1 });
};

projectSchema.statics.findProcessingProjects = function() {
  return this.find({ status: 'processing' });
};

// Instance methods
projectSchema.methods.markAsProcessing = function(promptId) {
  this.status = 'processing';
  this.comfyPromptId = promptId;
  this.processingStartedAt = new Date();
  return this.save();
};

projectSchema.methods.markAsCompleted = function(resultImage) {
  this.status = 'completed';
  this.resultImage = resultImage;
  this.processingCompletedAt = new Date();
  this.errorMessage = null;
  return this.save();
};

projectSchema.methods.markAsFailed = function(errorMessage) {
  this.status = 'failed';
  this.errorMessage = errorMessage;
  this.processingCompletedAt = new Date();
  return this.save();
};

projectSchema.methods.getProcessingDuration = function() {
  if (!this.processingStartedAt) return null;
  const endTime = this.processingCompletedAt || new Date();
  return endTime - this.processingStartedAt;
};

// Virtual for processing duration in seconds
projectSchema.virtual('processingDurationSeconds').get(function() {
  const duration = this.getProcessingDuration();
  return duration ? Math.round(duration / 1000) : null;
});

// Ensure virtuals are included in JSON output
projectSchema.set('toJSON', { virtuals: true });
projectSchema.set('toObject', { virtuals: true });

// Delete cached model to force schema re-registration during hot reload
if (mongoose.models.Project) {
  delete mongoose.models.Project;
}
const Project = mongoose.model('Project', projectSchema);

export default Project;
