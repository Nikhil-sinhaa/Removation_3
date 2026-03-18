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
    const changeLevel = formData.get('changeLevel') || 'medium';
    
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

    // ── Style descriptions ──────────────────────
    const STYLES = {
      'Modern':        'sleek modern interior, clean lines, minimalist furniture, polished surfaces, neutral tones, contemporary design',
      'Minimalist':    'minimalist interior, essential furniture only, white walls, uncluttered space, zen calm atmosphere',
      'Industrial':    'industrial interior, exposed brick, metal pipe fixtures, concrete floor, Edison bulb lighting, dark moody tones',
      'Bohemian':      'bohemian interior, colorful layered textiles, indoor plants, rattan wicker furniture, warm earthy colors, eclectic decor',
      'Scandinavian':  'scandinavian interior, light birch wood, white walls, cozy wool textures, hygge atmosphere, simple functional design',
      'Luxury':        'luxury interior, marble surfaces, gold brass accents, velvet upholstery, crystal chandelier, deep rich jewel tones',
      'Japandi':       'japandi interior, wabi-sabi aesthetic, natural wood grain, rice paper screens, muted sage and stone palette',
      'Traditional':   'traditional interior, ornate wooden furniture, warm mahogany tones, classic patterns, antique brass fixtures',
      'Rustic':        'rustic farmhouse interior, reclaimed barn wood, stone fireplace, linen textiles, warm amber lighting, natural materials',
      'Contemporary':  'contemporary interior, bold geometric shapes, mixed metal finishes, statement artwork, dynamic color blocking'
    }

    // ── Room descriptions ───────────────────────
    const ROOMS = {
      'Living Room':  'living room, comfortable sofa seating area, coffee table, entertainment zone',
      'Bedroom':      'bedroom, bed with headboard, wardrobe storage, restful sleeping sanctuary',
      'Kitchen':      'kitchen, cabinets and countertops, cooking and preparation area',
      'Bathroom':     'bathroom, bathtub or shower, vanity mirror, clean sanitary space',
      'Office':       'home office, work desk, bookshelves, focused productive workspace',
      'Dining Room':  'dining room, dining table with chairs, ambient meal sharing space'
    }

    // ── Color palettes ──────────────────────────
    const PALETTES = {
      'Warm':    'warm amber terracotta cream honey gold color palette',
      'Cool':    'cool ice blue silver grey white arctic color palette',
      'Neutral': 'neutral beige linen taupe greige white color palette',
      'Bold':    'bold deep navy forest green burgundy high contrast palette',
      'Earthy':  'earthy sage olive ochre rust brown natural color palette'
    }

    // ── Change intensity ────────────────────────
    const DENOISE = {
      'light':  0.45,   // subtle refresh — keeps most original
      'medium': 0.65,   // balanced redesign — recommended
      'heavy':  0.82    // dramatic transformation — keeps only structure
    }

    // ── Build final prompt ──────────────────────
    const styleText   = STYLES[style]   || STYLES['Modern']
    const roomText    = ROOMS[roomType] || ROOMS['Living Room']
    const paletteText = PALETTES[colorPalette] || PALETTES['Neutral']
    const denoiseVal  = DENOISE[changeLevel]   || DENOISE['medium']

    const positivePrompt = 
      `(professional architectural interior photography:1.4), ` +
      `${roomText}, ${styleText}, ${paletteText}, ` +
      `(preserve exact window positions:1.5), ` +
      `(preserve exact door positions:1.5), ` +
      `(preserve original wall layout:1.4), ` +
      `(preserve ceiling height and structure:1.3), ` +
      `photorealistic render, cinematic lighting, ` +
      `8k resolution, interior design magazine quality, ` +
      `sharp focus, professional photography` 

    const negativePrompt =
      `blurry, low quality, distorted, cartoon, anime, ` +
      `(moved windows:1.8), (moved doors:1.8), ` +
      `(changed room layout:1.6), (different architecture:1.6), ` +
      `extra furniture, text, watermark, oversaturated, ` +
      `unrealistic proportions, fish eye lens, bad perspective`
    
    // Load workflow from JSON file
    const workflowPath = '/home/nikhil/Documents/Remo2/Removation_3/src/workflows/redesign.json';
    const fs = await import('fs/promises');
    const workflowData = await fs.readFile(workflowPath, 'utf8');
    
    // Replace template variables
    const seed = Math.floor(Math.random() * 999999999);
    let workflowStr = workflowData
      .replace('"{{POSITIVE_PROMPT}}"', 
               JSON.stringify(positivePrompt))
      .replace('"{{NEGATIVE_PROMPT}}"', 
               JSON.stringify(negativePrompt))
      .replace('{{IMAGE_FILENAME}}', 
               filename)
      .replace('{{SEED}}', 
               seed.toString())
      .replace('"{{DENOISE}}"', denoiseVal.toString());
    
    const workflow = JSON.parse(workflowStr);

    // Create MongoDB Project
    const project = await Project.create({
      name: `${style} ${roomType}`,
      userId: '000000000000000000000000', // Default user ID for testing
      originalImage: `/uploads/${filename}`,
      status: 'queued',
      aiConfig: { style, roomType, colorPalette, changeLevel, positivePrompt, negativePrompt },
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
