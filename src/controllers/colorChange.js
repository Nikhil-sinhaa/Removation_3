/**
 * Color & Material Changer Controller
 * Handles targeted recoloring using SAM2 auto-masking and ControlNet Recolor
 */

import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import AIRun from '../models/AIRun.js';
import comfyBridge from '../services/comfyBridge.js';

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `recolor-${uniqueSuffix}${path.extname(file.originalname)}`);
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
 * POST /api/ai/recolor
 * Color & material change endpoint
 */
export const recolorImage = async (req, res) => {
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

      const { target, color, material } = req.body;

      // Validate required fields
      if (!target || !color) {
        await fs.unlink(req.file.path).catch(() => {});
        return res.status(400).json({ 
          error: 'Missing required fields',
          required: ['target', 'color'],
          optional: ['material']
        });
      }

      // Validate target
      const validTargets = ['walls', 'ceiling', 'floor', 'furniture', 'all'];
      if (!validTargets.includes(target)) {
        await fs.unlink(req.file.path).catch(() => {});
        return res.status(400).json({ 
          error: 'Invalid target',
          validTargets
        });
      }

      try {
        // Create project record
        const project = new AIRun({
          name: `${target} recolor to ${color}`,
          userId: req.user?.id || 'demo-user', // Fallback for demo
          originalImage: `/uploads/${req.file.filename}`,
          processingType: 'recolor',
          status: 'queued',
          aiConfig: {
            target,
            color,
            material: material || 'default',
            seed: Math.floor(Math.random() * 1000000)
          }
        });

        await project.save();

        // Build ComfyUI workflow
        const workflow = buildRecolorWorkflow({
          inputImage: req.file.path,
          target,
          color,
          material: material || 'default',
          seed: project.aiConfig.seed
        });

        // Queue job for processing
        await comfyBridge.enqueueJob(project._id, workflow);

        console.log(`✅ Recolor job queued: ${project._id} (${target} → ${color})`);

        res.json({
          projectId: project._id,
          status: 'queued',
          message: `${target} recolor to ${color} queued for processing`
        });

      } catch (error) {
        console.error('❌ Recolor processing error:', error);
        
        // Clean up uploaded file
        await fs.unlink(req.file.path).catch(() => {});
        
        res.status(500).json({ 
          error: 'Processing failed', 
          message: error.message 
        });
      }
    });
  } catch (error) {
    console.error('❌ Recolor endpoint error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: error.message 
    });
  }
};

/**
 * Build ComfyUI workflow for color & material change
 */
function buildRecolorWorkflow({ inputImage, target, color, material, seed }) {
  // Build targeted inpaint prompt based on target
  const prompt = buildTargetPrompt(target, color, material);
  
  const workflow = {
    "1": {
      "inputs": {
        "ckpt_name": "realvisxlV40.safetensors"
      },
      "class_type": "CheckpointLoaderSimple"
    },
    "2": {
      "inputs": {
        "vae_name": "sdxl_vae.safetensors"
      },
      "class_type": "VAELoader"
    },
    "3": {
      "inputs": {
        "image": inputImage,
        "upload": "image"
      },
      "class_type": "LoadImage"
    },
    "4": {
      "inputs": {
        "prompt": getTargetPrompt(target),
        "threshold": 0.5,
        "model_type": "SAM2"
      },
      "class_type": "GroundingDinoSAM2Segment"
    },
    "5": {
      "inputs": {
        "mask": ["4", 0],
        "expand": 5,
        "feather": 3
      },
      "class_type": "MaskGrow"
    },
    "6": {
      "inputs": {
        "text": prompt,
        "clip": ["1", 1],
        "text_g": "blurry, low quality, distorted, unrealistic, bad lighting",
        "clip_g": ["1", 1]
      },
      "class_type": "CLIPTextEncode"
    },
    "7": {
      "inputs": {
        "text": "",
        "clip": ["1", 1],
        "text_g": "",
        "clip_g": ["1", 1]
      },
      "class_type": "CLIPTextEncode"
    },
    "8": {
      "inputs": {
        "pixels": ["3", 0],
        "vae": ["2", 0],
        "fp8_e4m3fn": true
      },
      "class_type": "VAEEncodeForInpainting"
    },
    "9": {
      "inputs": {
        "pixels": ["8", 0],
        "mask": ["5", 0],
        "model": ["1", 0],
        "positive": ["6", 0],
        "negative": ["7", 0],
        "vae": ["2", 0],
        "denoise": 0.4,
        "cfg": 1.5,
        "sampler_name": "dpmpp_2m",
        "scheduler": "normal",
        "steps": 8,
        "seed": seed,
        "fp8_e4m3fn": true
      },
      "class_type": "KSampler"
    },
    "10": {
      "inputs": {
        "pixels": ["9", 0],
        "vae": ["2", 0],
        "fp8_e4m3fn": true,
        "tiling": {
          "enabled": true,
          "tile_size": 512,
          "tile_overlap": 64,
          "condition_on_size": ">=768"
        }
      },
      "class_type": "VAEDecodeTiled"
    },
    "11": {
      "inputs": {
        "control_net_name": "control-lora-recolor-rank256.safetensors"
      },
      "class_type": "ControlNetLoader"
    },
    "12": {
      "inputs": {
        "conditioning": ["6", 0],
        "control_net": ["11", 0],
        "image": ["3", 0],
        "strength": 0.8,
        "start_percent": 0.0,
        "end_percent": 0.9
      },
      "class_type": "ControlNetApplySDXL"
    },
    "13": {
      "inputs": {
        "filename_prefix": `recolor_${target}_${Date.now()}`,
        "images": ["10", 0]
      },
      "class_type": "SaveImage"
    },
    "14": {
      "inputs": {
        "enabled": true,
        "after_execution": true,
        "target_nodes": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13"]
      },
      "class_type": "GarbageCollector"
    }
  };

  // Update workflow to use ControlNet condition
  workflow['9'].inputs.positive = ["12", 0];

  return workflow;
}

/**
 * Build targeted prompt based on target type
 */
function buildTargetPrompt(target, color, material) {
  const prompts = {
    walls: `${color} ${material} wall paint, matte finish, smooth texture, even coverage, professional interior design`,
    ceiling: `${color} ceiling with ${material} texture, smooth finish, even lighting, professional interior design`,
    floor: `${color} ${material} flooring, realistic texture, proper perspective, interior design`,
    furniture: `${color} ${material} upholstery, fabric texture, comfortable, stylish furniture design`,
    all: `${color} ${material} surfaces, complete room makeover, cohesive design, professional interior renovation`
  };

  return prompts[target] || prompts.all;
}

/**
 * Get target-specific prompt for SAM2 segmentation
 */
function getTargetPrompt(target) {
  const prompts = {
    walls: 'walls, wall surfaces',
    ceiling: 'ceiling, ceiling surface',
    floor: 'floor, flooring, ground',
    furniture: 'furniture, chairs, tables, sofa, cabinets',
    all: 'walls, ceiling, floor, furniture'
  };

  return prompts[target] || prompts.all;
}

/**
 * GET /api/ai/recolor/:projectId/status
 * Get recolor project status
 */
export const getRecolorStatus = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const project = await AIRun.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ 
        error: 'Project not found' 
      });
    }

    if (project.processingType !== 'recolor') {
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
    console.error('❌ Get recolor status error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: error.message 
    });
  }
};

/**
 * GET /api/ai/recolor/:projectId
 * Get full recolor project details
 */
export const getRecolorProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const project = await AIRun.findById(projectId).populate('userId', 'name email');
    
    if (!project) {
      return res.status(404).json({ 
        error: 'Project not found' 
      });
    }

    if (project.processingType !== 'recolor') {
      return res.status(400).json({ 
        error: 'Invalid project type' 
      });
    }

    res.json(project);

  } catch (error) {
    console.error('❌ Get recolor project error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: error.message 
    });
  }
};

/**
 * DELETE /api/ai/recolor/:projectId
 * Delete recolor project
 */
export const deleteRecolorProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const project = await AIRun.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ 
        error: 'Project not found' 
      });
    }

    if (project.processingType !== 'recolor') {
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

    await AIRun.findByIdAndDelete(projectId);

    res.json({
      message: 'Recolor project deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete recolor project error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: error.message 
    });
  }
};

/**
 * GET /api/ai/recolor/presets
 * Get available color and material presets
 */
export const getRecolorPresets = async (req, res) => {
  try {
    const presets = {
      colors: [
        { name: 'White', hex: '#FFFFFF', category: 'neutral' },
        { name: 'Beige', hex: '#F5DEB3', category: 'neutral' },
        { name: 'Gray', hex: '#808080', category: 'neutral' },
        { name: 'Navy Blue', hex: '#000080', category: 'cool' },
        { name: 'Sky Blue', hex: '#87CEEB', category: 'cool' },
        { name: 'Forest Green', hex: '#228B22', category: 'warm' },
        { name: 'Burgundy', hex: '#800020', category: 'warm' },
        { name: 'Terracotta', hex: '#E2725B', category: 'warm' }
      ],
      materials: [
        { name: 'Matte Paint', description: 'Flat, non-reflective finish' },
        { name: 'Satin Paint', description: 'Soft, subtle sheen' },
        { name: 'Glossy Paint', description: 'High shine, reflective' },
        { name: 'Wood', description: 'Natural wood grain texture' },
        { name: 'Marble', description: 'Luxurious stone texture' },
        { name: 'Concrete', description: 'Modern industrial texture' },
        { name: 'Fabric', description: 'Soft cloth texture' },
        { name: 'Leather', description: 'Premium leather texture' },
        { name: 'Tile', description: 'Ceramic or stone tile' },
        { name: 'Carpet', description: 'Soft fiber texture' }
      ],
      targets: [
        { value: 'walls', label: 'Walls', description: 'All wall surfaces' },
        { value: 'ceiling', label: 'Ceiling', description: 'Ceiling surface only' },
        { value: 'floor', label: 'Floor', description: 'Flooring surface' },
        { value: 'furniture', label: 'Furniture', description: 'All furniture pieces' },
        { value: 'all', label: 'All Surfaces', description: 'Complete room makeover' }
      ]
    };

    res.json(presets);

  } catch (error) {
    console.error('❌ Get presets error:', error);
    res.status(500).json({ 
      error: 'Server error', 
      message: error.message 
    });
  }
};

// Export the upload middleware for use in routes
export { upload as recolorUpload };
