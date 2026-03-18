/**
 * Object Removal Controller
 * Handles AI-powered object removal using GroundingDinoSAM2Segment and inpainting
 */

import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import Project from '../models/Project.js';
import comfyBridge from '../services/comfyBridge.js';
import objectRemovalWorkflow from '../workflows/object_removal.json' assert { type: 'json' };

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `removal-${uniqueSuffix}${path.extname(file.originalname)}`);
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
 * POST /api/ai/remove-object
 * Object removal endpoint
 */
export const removeObject = async (req, res) => {
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

      const { objectName } = req.body;

      // Validate required fields
      if (!objectName || objectName.trim().length === 0) {
        // Clean up uploaded file
        await fs.unlink(req.file.path).catch(() => {});
        return res.status(400).json({ 
          error: 'Missing required field: objectName',
          message: 'Please specify the object to remove'
        });
      }

      try {
        // Create project record
        const project = new Project({
          name: `Remove ${objectName}`,
          userId: req.user?.id || 'demo-user', // Fallback for demo
          originalImage: `/uploads/${req.file.filename}`,
          processingType: 'object_removal',
          status: 'queued',
          aiConfig: {
            objectName: objectName.trim(),
            seed: Math.floor(Math.random() * 1000000)
          }
        });

        await project.save();

        // Build ComfyUI workflow
        const workflow = buildObjectRemovalWorkflow({
          inputImage: req.file.path,
          objectName: objectName.trim(),
          seed: project.aiConfig.seed
        });

        // Queue job for processing
        await comfyBridge.enqueueJob(project._id, workflow);

        console.log(`✅ Object removal job queued: ${project._id} (object: ${objectName})`);

        res.json({
          projectId: project._id,
          status: 'queued',
          message: `Object "${objectName}" removal queued for processing`
        });

      } catch (error) {
        console.error('❌ Object removal processing error:', error);
        
        // Clean up uploaded file
        await fs.unlink(req.file.path).catch(() => {});
        
        res.status(500).json({ 
          error: 'Processing failed', 
          message: error.message 
        });
      }
    });
  } catch (error) {
    console.error('❌ Object removal endpoint error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: error.message 
    });
  }
};

/**
 * Build ComfyUI workflow for object removal
 */
function buildObjectRemovalWorkflow({ inputImage, objectName, seed }) {
  const workflow = JSON.parse(JSON.stringify(objectRemovalWorkflow));

  // Replace placeholders in the workflow
  workflow['3'].inputs.image = inputImage;
  workflow['4'].inputs.prompt = objectName;

  // Set seed for reproducible results
  if (workflow['7'].inputs.seed !== undefined) {
    workflow['7'].inputs.seed = seed;
  }

  // Update filename prefix with timestamp
  workflow['11'].inputs.filename_prefix = `object_removal_${Date.now()}`;

  return workflow;
}

/**
 * GET /api/ai/remove-object/:projectId/status
 * Get object removal project status
 */
export const getRemovalStatus = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ 
        error: 'Project not found' 
      });
    }

    if (project.processingType !== 'object_removal') {
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
    console.error('❌ Get removal status error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: error.message 
    });
  }
};

/**
 * GET /api/ai/remove-object/:projectId
 * Get full object removal project details
 */
export const getRemovalProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const project = await Project.findById(projectId).populate('userId', 'name email');
    
    if (!project) {
      return res.status(404).json({ 
        error: 'Project not found' 
      });
    }

    if (project.processingType !== 'object_removal') {
      return res.status(400).json({ 
        error: 'Invalid project type' 
      });
    }

    res.json(project);

  } catch (error) {
    console.error('❌ Get removal project error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: error.message 
    });
  }
};

/**
 * DELETE /api/ai/remove-object/:projectId
 * Delete object removal project
 */
export const deleteRemovalProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ 
        error: 'Project not found' 
      });
    }

    if (project.processingType !== 'object_removal') {
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
      message: 'Object removal project deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete removal project error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: error.message 
    });
  }
};

/**
 * POST /api/ai/remove-object/batch
 * Batch object removal (multiple objects from same image)
 */
export const batchRemoveObjects = async (req, res) => {
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

      const { objectNames } = req.body;

      // Validate required fields
      if (!objectNames || !Array.isArray(objectNames) || objectNames.length === 0) {
        await fs.unlink(req.file.path).catch(() => {});
        return res.status(400).json({ 
          error: 'Missing required field: objectNames',
          message: 'Please provide an array of objects to remove'
        });
      }

      try {
        const projects = [];
        
        // Create a project for each object to remove
        for (const objectName of objectNames) {
          const project = new Project({
            name: `Remove ${objectName}`,
            userId: req.user?.id || 'demo-user',
            originalImage: `/uploads/${req.file.filename}`,
            processingType: 'object_removal',
            status: 'queued',
            aiConfig: {
              objectName: objectName.trim(),
              seed: Math.floor(Math.random() * 1000000)
            }
          });

          await project.save();

          // Build ComfyUI workflow
          const workflow = buildObjectRemovalWorkflow({
            inputImage: req.file.path,
            objectName: objectName.trim(),
            seed: project.aiConfig.seed
          });

          // Queue job for processing
          await comfyBridge.enqueueJob(project._id, workflow);
          
          projects.push({
            projectId: project._id,
            objectName: objectName.trim(),
            status: 'queued'
          });
        }

        console.log(`✅ Batch object removal jobs queued: ${projects.length} objects`);

        res.json({
          batchId: uuidv4(),
          projects,
          status: 'queued',
          message: `${projects.length} object removal jobs queued for processing`
        });

      } catch (error) {
        console.error('❌ Batch object removal processing error:', error);
        
        // Clean up uploaded file
        await fs.unlink(req.file.path).catch(() => {});
        
        res.status(500).json({ 
          error: 'Processing failed', 
          message: error.message 
        });
      }
    });
  } catch (error) {
    console.error('❌ Batch object removal endpoint error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: error.message 
    });
  }
};

// Export the upload middleware for use in routes
export { upload as removalUpload };
