/**
 * Room Redesign Controller (EXPRESS — DEPRECATED)
 * 
 * ⚠️  THIS FILE IS NOT USED by the Next.js app.
 * The REAL handler is: app/api/ai/redesign/route.js
 * This file is kept only as a reference.
 * Any changes should be made in route.js instead.
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
            changeLevel: req.body.changeLevel || 'medium',
            seed: Math.floor(Math.random() * 1000000)
          }
        });

        await project.save();

        // Copy uploaded image to ComfyUI input folder
        const comfyInputDir = '/home/nikhil/Documents/Remo2/ComfyUI/input'
        const comfyFilename = `redesign_${Date.now()}_${req.file.filename}` 
        const comfyInputPath = path.join(comfyInputDir, comfyFilename)
        
        await fs.copyFile(req.file.path, comfyInputPath)
        console.log(`Image copied to ComfyUI: ${comfyFilename}`)

        // Build ComfyUI workflow
        const workflow = buildRedesignWorkflow({
          inputImage: comfyFilename,
          style,
          roomType,
          colorPalette,
          changeLevel: req.body.changeLevel || 'medium',
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
function buildRedesignWorkflow({ 
  inputImage, style, roomType, 
  colorPalette, seed, changeLevel = 'medium' 
}) {
  const workflow = JSON.parse(JSON.stringify(redesignWorkflow));

  const denoiseMap = {
    'light':  0.45,  // subtle changes, keeps most of original
    'medium': 0.65,  // balanced changes
    'heavy':  0.80   // dramatic transformation
  }

  const denoise = denoiseMap[changeLevel] || 0.65

  const styleMap = {
    'Modern':       'modern contemporary interior, clean straight lines, minimal clutter, neutral base tones',
    'Minimalist':   'minimalist interior, bare white walls, simple functional furniture, zen atmosphere',
    'Industrial':   'industrial loft interior, exposed brick walls, metal pipe fixtures, raw concrete ceiling',
    'Bohemian':     'bohemian eclectic interior, warm earth tones, layered rugs, hanging plants, rattan furniture',
    'Scandinavian': 'scandinavian hygge interior, white walls, light birch wood, cozy wool textiles, simple forms',
    'Luxury':       'luxury high-end interior, marble flooring, gold brass accents, velvet furniture, crystal chandelier',
    'Japandi':      'japandi wabi-sabi interior, natural wood grain, muted sage green, handcrafted ceramics, low furniture',
    'Traditional':  'traditional classic interior, ornate wooden furniture, rich burgundy tones, crown molding, antiques'
  }

  const roomMap = {
    'Living Room':      'spacious living room, sofa and armchairs around coffee table, entertainment unit, floor lamp',
    'Bedroom':          'master bedroom, king bed with headboard, bedside tables with lamps, wardrobe, soft carpet',
    'Kitchen':          'modern kitchen, upper and lower cabinets, kitchen island, pendant lights, backsplash tiles',
    'Bathroom':         'elegant bathroom, freestanding bathtub, walk-in shower, double vanity, heated towel rail',
    'Dining Room':      'formal dining room, rectangular dining table, upholstered chairs, sideboard, statement chandelier',
    'Home Office':      'productive home office, large desk, ergonomic chair, built-in bookshelves, task lighting',
    'Garden/Outdoor':   'outdoor garden space, weather-resistant furniture, string lights, potted plants, paved patio'
  }

  const colorMap = {
    'Warm':    'warm inviting palette, amber honey tones, terracotta, burnt orange, cream white, warm wood',
    'Cool':    'cool sophisticated palette, slate grey, powder blue, crisp white, brushed silver, cool marble',
    'Neutral': 'timeless neutral palette, greige, off-white, taupe, natural linen, matte stone textures',
    'Bold':    'bold dramatic palette, deep navy blue, forest emerald green, rich burgundy, matte black accents',
    'Earthy':  'organic earthy palette, warm brown, terracotta rust, olive sage, sandy beige, natural jute'
  }

  const styleDesc = styleMap[style] || `${style} interior design style` 
  const roomDesc = roomMap[roomType] || `${roomType} interior space` 
  const colorDesc = colorMap[colorPalette] || `${colorPalette} color scheme` 

  const positivePrompt = [
    '(professional architectural interior photography:1.4)',
    '(preserve exact original room structure walls windows doors:1.5)',
    '(maintain same room dimensions and layout:1.3)',
    roomDesc,
    styleDesc,
    colorDesc,
    'sharp focus throughout',
    'perfect furniture placement',
    'realistic textures and materials',
    'professional lighting setup',
    'ultra high detail 8k resolution',
    'interior design magazine quality'
  ].join(', ')

  const negativePrompt = [
    '(different room layout:1.5)',
    '(moved walls or windows:1.4)',
    '(wrong room type:1.3)',
    'blurry',
    'out of focus',
    'low resolution',
    'low quality',
    'pixelated',
    'jpeg artifacts',
    'floating furniture',
    'furniture clipping through walls',
    'unrealistic perspective',
    'distorted proportions',
    'cartoon illustration',
    'painting artwork',
    'oversaturated colors',
    'text watermark logo',
    'extra rooms',
    'outdoor scene'
  ].join(', ')

  // Replace placeholders in the workflow
  // Ensure only filename not full path
  const imageFilename = path.basename(inputImage)
  workflow['1'].inputs.image = imageFilename;
  workflow['3'].inputs.text = positivePrompt;
  workflow['4'].inputs.text = negativePrompt;

  // Set denoise value
  workflow['6'].inputs.denoise = denoise

  // Set seed for reproducible results
  if (workflow['6'].inputs.seed !== undefined) {
    workflow['6'].inputs.seed = seed;
  }

  // Update filename prefix with timestamp
  workflow['8'].inputs.filename_prefix = `removation_`;

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
