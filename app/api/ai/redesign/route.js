/**
 * API Route for Room Redesign
 * Handles POST /api/ai/redesign requests
 */

import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { connectDB } from '../../../../src/lib/mongodb.js';
import Project from '../../../../src/models/Project.js';
import comfyBridge from '../../../../src/services/comfyBridge.js';

export async function POST(request) {
  await connectDB()
  try {
    console.log('🎨 Starting room redesign...');
    
    // Parse form data
    const formData = await request.formData();
    const imageFile = formData.get('image');
    const style = formData.get('style') || 'Modern';
    const roomType = formData.get('roomType') || 'Living Room';
    const colorPalette = formData.get('colorPalette') || 'Neutral';

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
    
    const filename = `redesign_${Date.now()}_${imageFile.name}`;
    const filepath = path.join(comfyUIInputDir, filename);
    await writeFile(filepath, buffer);

    console.log('💾 Image saved to ComfyUI input:', filename);

    // Build positive prompt
    const prompt = `(Architectural editorial photo:1.2), maintain original room geometry, ${style} interior design, ${colorPalette} palette, cinematic lighting, 8k`;
    
    // Load workflow from JSON file
    const workflowPath = '/home/nikhil/Documents/Remo2/Removation_3/src/workflows/redesign.json';
    const fs = await import('fs/promises');
    const workflowData = await fs.readFile(workflowPath, 'utf8');
    
    // Replace template variables
    const seed = Math.floor(Math.random() * 999999);
    let workflowStr = workflowData
      .replace(/\{\{POSITIVE_PROMPT\}\}/g, prompt)
      .replace(/\{\{IMAGE_FILENAME\}\}/g, filename)
      .replace(/\{\{SEED\}\}/g, seed.toString());
    
    const workflow = JSON.parse(workflowStr);

    // Create MongoDB Project
    const project = await Project.create({
      name: `${style} ${roomType}`,
      userId: '000000000000000000000000', // Default user ID for testing
      originalImage: `/uploads/${filename}`,
      status: 'queued',
      aiConfig: { style, roomType, colorPalette, prompt },
      processingType: 'redesign'
    });

    // Enqueue job
    await comfyBridge.enqueueJob(project._id.toString(), workflow);

    console.log(`✅ Redesign job queued: ${project._id}`);

    return Response.json({ 
      projectId: project._id, 
      status: 'queued',
      message: 'Generation started'
    });

  } catch (error) {
    console.error('❌ Redesign API error:', error);
    return Response.json({ 
      error: 'Generation failed', 
      message: error.message 
    }, { status: 500 });
  }
}

export async function GET(request) {
  await connectDB()
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
  await connectDB()
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
