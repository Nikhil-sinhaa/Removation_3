/**
 * API Route for Color & Material Change
 * Handles POST /api/ai/recolor requests
 */

import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import Project from '../../../../src/models/Project.js';
import comfyBridge from '../../../../src/services/comfyBridge.js';

export async function POST(request) {
  try {
    console.log('🖌️ Starting color recolor...');
    
    // Parse form data
    const formData = await request.formData();
    const imageFile = formData.get('image');
    const target = formData.get('target') || 'walls';
    const color = formData.get('color') || 'white';
    const material = formData.get('material') || 'matte paint';

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
    
    const filename = `recolor_${Date.now()}_${imageFile.name}`;
    const filepath = path.join(comfyUIInputDir, filename);
    await writeFile(filepath, buffer);

    console.log('💾 Image saved to ComfyUI input:', filename);

    // Build targeted prompt based on target
    let targetPrompt = '';
    switch (target) {
      case 'walls':
        targetPrompt = `${color} ${material} wall paint, matte finish`;
        break;
      case 'ceiling':
        targetPrompt = `${color} ceiling with ${material} texture`;
        break;
      case 'floor':
        targetPrompt = `${color} ${material} flooring`;
        break;
      case 'furniture':
        targetPrompt = `${color} ${material} upholstery`;
        break;
      case 'all':
        targetPrompt = `${color} ${material} interior design`;
        break;
      default:
        targetPrompt = `${color} ${material} walls`;
    }

    // Build recolor workflow
    const workflow = {
      "1": {
        "inputs": {
          "ckpt_name": "sd_xl_base_1.0.safetensors"
        },
        "class_type": "CheckpointLoaderSimple"
      },
      "2": {
        "inputs": {
          "text": `interior design, ${targetPrompt}, professional photography, high quality, clean lines`,
          "clip": ["1", 1]
        },
        "class_type": "CLIPTextEncode"
      },
      "3": {
        "inputs": {
          "text": "blurry, distorted, low quality, watermark, text, cartoon, anime",
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
          "denoise": 0.4,
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
          "filename_prefix": `recolor_${Date.now()}`,
          "images": ["6", 0]
        },
        "class_type": "SaveImage"
      }
    };

    // Create MongoDB Project
    const project = await Project.create({
      name: `Recolor ${target}`,
      originalImage: `/uploads/${filename}`,
      status: 'queued',
      processingType: 'recolor',
      aiConfig: { target, color, material }
    });

    // Enqueue job
    await comfyBridge.enqueueJob(project._id.toString(), workflow);

    console.log(`✅ Recolor job queued: ${project._id}`);

    return Response.json({ 
      projectId: project._id, 
      status: 'queued',
      message: 'Recolor started'
    });

  } catch (error) {
    console.error('❌ Recolor API error:', error);
    return Response.json({ 
      error: 'Recolor failed', 
      message: error.message 
    }, { status: 500 });
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const presets = searchParams.get('presets');
  
  if (presets === 'true') {
    return Response.json({
      colors: [
        { name: 'White', hex: '#FFFFFF' },
        { name: 'Beige', hex: '#F5F5DC' },
        { name: 'Gray', hex: '#808080' },
        { name: 'Blue', hex: '#0066CC' },
        { name: 'Green', hex: '#4CAF50' },
        { name: 'Red', hex: '#FF0000' }
      ],
      materials: [
        { name: 'Matte Paint' },
        { name: 'Gloss Paint' },
        { name: 'Wood' },
        { name: 'Marble' },
        { name: 'Concrete' },
        { name: 'Plaster' },
        { name: 'Brick' }
      ],
      targets: [
        { value: 'walls', label: 'Walls' },
        { value: 'ceiling', label: 'Ceiling' },
        { value: 'floor', label: 'Floor' },
        { value: 'furniture', label: 'Furniture' },
        { value: 'all', label: 'All Surfaces' }
      ]
    });
  }
  
  if (projectId) {
    const project = await Project.findById(projectId);
    if (!project) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }
    return Response.json(project);
  }
  
  return Response.json({ message: 'Project ID or presets parameter required' }, { status: 400 });
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
