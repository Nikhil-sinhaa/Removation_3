/**
 * FurniturePlacementRun — MongoDB model for the Furniture Placement feature.
 * Tracks each placement run: inputs, intermediate files, and final result.
 */

import mongoose from 'mongoose';

const FurniturePlacementRunSchema = new mongoose.Schema({
  userId:    { type: String, required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },

  // Input file public URLs
  roomImageUrl:      { type: String, required: true },
  furnitureImageUrl: { type: String, required: true },

  // Placement data captured from Fabric.js canvas
  placement: {
    x:        { type: Number },
    y:        { type: Number },
    scaleX:   { type: Number },
    scaleY:   { type: Number },
    rotation: { type: Number },
    width:    { type: Number },
    height:   { type: Number },
  },

  // Intermediate processing files
  furnitureNoBgUrl: { type: String },
  compositeUrl:     { type: String },
  maskUrl:          { type: String },

  // Final AI-blended result
  resultUrl: { type: String },

  status: {
    type: String,
    enum: ['processing', 'done', 'error'],
    default: 'processing',
  },
  errorMessage: { type: String },
}, { timestamps: true });

export default mongoose.models.FurniturePlacementRun
  || mongoose.model('FurniturePlacementRun', FurniturePlacementRunSchema);
