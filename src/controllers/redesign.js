/**
 * Room Redesign Controller
 * Handles structure-preserving room redesign using ControlNet
 */

import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import Project from '../models/Project.js';
import comfyBridge from '../services/comfyBridge.js';
import redesignWorkflow from '../workflows/redesign.json' assert { type: 'json' };

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `redesign-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, jpg, png, webp) are allowed'));
    }
  }
});

/**
 * POST /api/ai/redesign
 * Room redesign endpoint
 */
export const redesignRoom = async (req, res) => {
  try {
    const uploadMiddleware = upload.single('image');
    
    uploadMiddleware(req, res, async (err) => {
      if (err) {
        console.error('❌ Upload error:', err);
        return res.status(400).json({ 
          error: 'Upload failed', 
          message: err.message 
        });
      }

      if (!req.file) {
        return res.status(400).json({ 
          error: 'No image uploaded' 
        });
      }

      const { style, roomType, colorPalette } = req.body;

      // Validate required fields
      if (!style || !roomType || !colorPalette) {
        // Clean up uploaded file
        await fs.unlink(req.file.path).catch(() => {});
        return res.status(400).json({ 
          error: 'Missing required fields',
          required: ['style', 'roomType', 'colorPalette']
        });
      }

      try {
        // Create project record
        const project = new Project({
          name: `${style} ${roomType} Redesign`,
          userId: req.user?.id || 'demo-user', // Fallback for demo
          originalImage: `/uploads/${req.file.filename}`,
          processingType: 'redesign',
          status: 'queued',
          aiConfig: {
            style,
            roomType,
            colorPalette,
            seed: Math.floor(Math.random() * 1000000)
          }
        });

        await project.save();

        // Build ComfyUI workflow
        const workflow = buildRedesignWorkflow({
          inputImage: req.file.path,
          style,
          roomType,
          colorPalette,
          seed: project.aiConfig.seed
        });

        // Queue job for processing
        await comfyBridge.enqueueJob(project._id, workflow);

        console.log(`✅ Redesign job queued: ${project._id}`);

        res.json({
          projectId: project._id,
          status: 'queued',
          message: 'Room redesign queued for processing'
        });

      } catch (error) {
        console.error('❌ Redesign processing error:', error);
        
        // Clean up uploaded file
        await fs.unlink(req.file.path).catch(() => {});
        
        res.status(500).json({ 
          error: 'Processing failed', 
          message: error.message 
        });
      }
    });
  } catch (error) {
    console.error('❌ Redesign endpoint error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: error.message 
    });
  }
};

/**
 * Build ComfyUI workflow for room redesign
 */
function buildRedesignWorkflow({ inputImage, style, roomType, colorPalette, seed }) {
  const workflow = JSON.parse(JSON.stringify(redesignWorkflow));

  // Replace placeholders in the workflow
  workflow['4'].inputs.image = inputImage;
  
  // Update prompt text with actual values
  workflow['2'].inputs.text = workflow['2'].inputs.text
    .replace('{style}', style)
    .replace('{colorPalette}', colorPalette);

  // Update negative prompt if needed
  workflow['3'].inputs.text_g = workflow['3'].inputs.text_g;

  // Set seed for reproducible results
  if (workflow['8'].inputs.seed !== undefined) {
    workflow['8'].inputs.seed = seed;
  }

  // Update filename prefix with timestamp
  workflow['10'].inputs.filename_prefix = `removation_redesign_${Date.now()}`;

  return workflow;
}

/**
 * GET /api/ai/redesign/:projectId/status
 * Get redesign project status
 */
export const getRedesignStatus = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ 
        error: 'Project not found' 
      });
    }

    if (project.processingType !== 'redesign') {
      return res.status(400).json({ 
        error: 'Invalid project type' 
      });
    }

    res.json({
      projectId: project._id,
      status: project.status,
      originalImage: project.originalImage,
      resultImage: project.resultImage,
      processingStartedAt: project.processingStartedAt,
      processingCompletedAt: project.processingCompletedAt,
      processingDurationSeconds: project.processingDurationSeconds,
      errorMessage: project.errorMessage,
      aiConfig: project.aiConfig
    });

  } catch (error) {
    console.error('❌ Get status error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: error.message 
    });
  }
};

/**
 * GET /api/ai/redesign/:projectId
 * Get full redesign project details
 */
export const getRedesignProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const project = await Project.findById(projectId).populate('userId', 'name email');
    
    if (!project) {
      return res.status(404).json({ 
        error: 'Project not found' 
      });
    }

    if (project.processingType !== 'redesign') {
      return res.status(400).json({ 
        error: 'Invalid project type' 
      });
    }

    res.json(project);

  } catch (error) {
    console.error('❌ Get project error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: error.message 
    });
  }
};

/**
 * DELETE /api/ai/redesign/:projectId
 * Delete redesign project
 */
export const deleteRedesignProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ 
        error: 'Project not found' 
      });
    }

    if (project.processingType !== 'redesign') {
      return res.status(400).json({ 
        error: 'Invalid project type' 
      });
    }

    // Delete associated image files
    try {
      if (project.originalImage) {
        await fs.unlink(path.join('uploads', path.basename(project.originalImage)));
      }
      if (project.resultImage && project.resultImage.startsWith('/uploads/')) {
        await fs.unlink(path.join('uploads', path.basename(project.resultImage)));
      }
    } catch (fileError) {
      console.warn('⚠️ Failed to delete files:', fileError.message);
    }

    await Project.findByIdAndDelete(projectId);

    res.json({
      message: 'Project deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete project error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: error.message 
    });
  }
};

// Export the upload middleware for use in routes
export { upload as redesignUpload };
