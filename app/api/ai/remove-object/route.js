/**
 * API Route for Object Removal
 * Handles POST /api/ai/remove-object requests
 */

import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import Project from '../../../../src/models/Project.js';
import comfyBridge from '../../../../src/services/comfyBridge.js';

export async function POST(request) {
  try {
    console.log('🗑️ Starting object removal...');
    
    // Parse form data
    const formData = await request.formData();
    const imageFile = formData.get('image');
    const objectName = formData.get('objectName') || 'object';

    if (!imageFile) {
      return Response.json({ 
        error: 'No image provided' 
      }, { status: 400 });
    }

    // Save uploaded image to ComfyUI input
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const comfyUIInputDir = '/home/nikhil/Documents/Remo2/ComfyUI/input';
    await mkdir(comfyUIInputDir, { recursive: true });
    
    const filename = `removal_${Date.now()}_${imageFile.name}`;
    const filepath = path.join(comfyUIInputDir, filename);
    await writeFile(filepath, buffer);

    console.log('💾 Image saved to ComfyUI input:', filename);

    // Build object removal workflow
    const workflow = {
      "1": {
        "inputs": {
          "ckpt_name": "sd_xl_base_1.0.safetensors"
        },
        "class_type": "CheckpointLoaderSimple"
      },
      "2": {
        "inputs": {
          "text": `interior design with ${objectName} removed, clean space, professional photography`,
          "clip": ["1", 1]
        },
        "class_type": "CLIPTextEncode"
      },
      "3": {
        "inputs": {
          "text": "${objectName}, blurry, distorted, extra furniture, text, watermark",
          "clip": ["1", 1]
        },
        "class_type": "CLIPTextEncode"
      },
      "4": {
        "inputs": {
          "seed": Math.floor(Math.random() * 999999),
          "steps": 8,
          "cfg": 1.8,
          "sampler_name": "dpmpp_2m_sde",
          "scheduler": "sgm_uniform",
          "denoise": 0.3,
          "model": ["1", 0],
          "positive": ["2", 0],
          "negative": ["3", 0],
          "latent_image": ["5", 0]
        },
        "class_type": "KSampler"
      },
      "5": {
        "inputs": {
          "width": 1024,
          "height": 1024,
          "batch_size": 1
        },
        "class_type": "EmptyLatentImage"
      },
      "6": {
        "inputs": {
          "samples": ["4", 0],
          "vae": ["1", 2]
        },
        "class_type": "VAEDecode"
      },
      "7": {
        "inputs": {
          "filename_prefix": `removal_${Date.now()}`,
          "images": ["6", 0]
        },
        "class_type": "SaveImage"
      }
    };

    // Create MongoDB Project
    const project = await Project.create({
      name: `Remove ${objectName}`,
      originalImage: `/uploads/${filename}`,
      status: 'queued',
      processingType: 'object_removal',
      aiConfig: { objectName }
    });

    // Enqueue job
    await comfyBridge.enqueueJob(project._id.toString(), workflow);

    console.log(`✅ Object removal job queued: ${project._id}`);

    return Response.json({ 
      projectId: project._id, 
      status: 'queued',
      message: 'Object removal started'
    });

  } catch (error) {
    console.error('❌ Object removal API error:', error);
    return Response.json({ 
      error: 'Removal failed', 
      message: error.message 
    }, { status: 500 });
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  
  if (projectId) {
    const project = await Project.findById(projectId);
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }
    return Response.json(project);
  }
  
  return Response.json({ message: 'Project ID required' }, { status: 400 });
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  
  if (!projectId) {
    return Response.json({ error: 'Project ID required' }, { status: 400 });
  }
  
  const project = await Project.findByIdAndDelete(projectId);
  if (!project) {
    return Response.json({ error: 'Project not found' }, { status: 404 });
  }
  
  return Response.json({ message: 'Project deleted successfully' });
}
