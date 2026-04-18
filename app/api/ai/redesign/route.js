/**
 * API Route for Room Redesign — Next.js App Router
 * Handles POST /api/ai/redesign requests
 * 
 * Uses the same buildRedesignWorkflow logic as src/controllers/redesign.js.
 * The JSON template approach has been removed — workflow is built in JS
 * to avoid placeholder parsing issues.
 */

import { writeFile, mkdir, copyFile } from 'fs/promises';
import path from 'path';
import { connectDB } from '../../../../src/lib/mongodb.js';
import Project from '../../../../src/models/Project.js';
import comfyBridge from '../../../../src/services/comfyBridge.js';
import { NextResponse } from 'next/server';

// ─── Lookup Maps ─────────────────────────────────────────────────────────────

const STYLE_MAP = {
  'Modern':       'modern contemporary interior, clean straight lines, minimal clutter, neutral base tones',
  'Minimalist':   'minimalist interior, bare white walls, simple functional furniture, zen atmosphere',
  'Industrial':   'industrial loft interior, exposed brick walls, metal pipe fixtures, raw concrete ceiling',
  'Bohemian':     'bohemian eclectic interior, warm earth tones, layered rugs, hanging plants, rattan furniture',
  'Scandinavian': 'scandinavian hygge interior, white walls, light birch wood, cozy wool textiles, simple forms',
  'Luxury':       'luxury high-end interior, marble flooring, gold brass accents, velvet furniture, crystal chandelier',
  'Japandi':      'japandi wabi-sabi interior, natural wood grain, muted sage green, handcrafted ceramics, low furniture',
  'Traditional':  'traditional classic interior, ornate wooden furniture, rich burgundy tones, crown molding, antiques',
  'master':       'professionally designed interior, curated materials, harmonious design language',
  'professional': 'precision-engineered architectural interior, structural fidelity, photorealistic rendering',
};

const ROOM_MAP = {
  'living_room':    'spacious living room, sofa and armchairs around coffee table, entertainment unit, floor lamp',
  'Living Room':    'spacious living room, sofa and armchairs around coffee table, entertainment unit, floor lamp',
  'bedroom':        'master bedroom, king bed with headboard, bedside tables with lamps, wardrobe, soft carpet',
  'Bedroom':        'master bedroom, king bed with headboard, bedside tables with lamps, wardrobe, soft carpet',
  'kitchen':        'modern kitchen, upper and lower cabinets, kitchen island, pendant lights, backsplash tiles',
  'Kitchen':        'modern kitchen, upper and lower cabinets, kitchen island, pendant lights, backsplash tiles',
  'bathroom':       'elegant bathroom, freestanding bathtub, walk-in shower, double vanity, heated towel rail',
  'Bathroom':       'elegant bathroom, freestanding bathtub, walk-in shower, double vanity, heated towel rail',
  'dining_room':    'formal dining room, rectangular dining table, upholstered chairs, sideboard, statement chandelier',
  'Dining Room':    'formal dining room, rectangular dining table, upholstered chairs, sideboard, statement chandelier',
  'office':         'productive home office, large desk, ergonomic chair, built-in bookshelves, task lighting',
  'Home Office':    'productive home office, large desk, ergonomic chair, built-in bookshelves, task lighting',
  'garden':         'outdoor garden space, weather-resistant furniture, string lights, potted plants, paved patio',
  'Garden/Outdoor': 'outdoor garden space, weather-resistant furniture, string lights, potted plants, paved patio',
};

const COLOR_MAP = {
  'Warm':    'warm inviting palette, amber honey tones, terracotta, burnt orange, cream white, warm wood',
  'Cool':    'cool sophisticated palette, slate grey, powder blue, crisp white, brushed silver, cool marble',
  'Neutral': 'timeless neutral palette, greige, off-white, taupe, natural linen, matte stone textures',
  'Bold':    'bold dramatic palette, deep navy blue, forest emerald green, rich burgundy, matte black accents',
  'Earthy':  'organic earthy palette, warm brown, terracotta rust, olive sage, sandy beige, natural jute',
};

const DENOISE_MAP = {
  'light':  0.45,
  'medium': 0.65,
  'heavy':  0.80,
};

// ─── Workflow Builder ─────────────────────────────────────────────────────────

function buildRedesignWorkflow({
  imageFilename,
  style,
  roomType,
  colorPalette,
  changeLevel = 'medium',
  seed,
  masterSelector,
  masterToggles,
  useControlNet = true,
}) {
  const denoise = DENOISE_MAP[changeLevel] ?? 0.65;

  const styleDesc = STYLE_MAP[style]       || `${style} interior design style`;
  const roomDesc  = ROOM_MAP[roomType]      || `${roomType} interior space`;
  const colorDesc = COLOR_MAP[colorPalette] || `${colorPalette} color scheme`;

  // ── Prompt: Master Design mode (specific material/finish selections) ────────
  let positivePrompt, negativePrompt;

  if (masterSelector && masterToggles) {
    const parts = [];
    if (masterToggles.walls     && masterSelector.wallColor     && masterSelector.wallColor !== 'keep_original')     parts.push(`${masterSelector.wallColor} walls`);
    if (masterToggles.ceiling   && masterSelector.ceiling       && masterSelector.ceiling !== 'keep_original')       parts.push(`${masterSelector.ceiling} ceiling`);
    if (masterToggles.furniture && masterSelector.furnitureStyle && masterSelector.furnitureStyle !== 'keep_original') parts.push(`${masterSelector.furnitureStyle} furniture`);
    if (masterToggles.floor     && masterSelector.floorType     && masterSelector.floorType !== 'keep_original')     parts.push(`${masterSelector.floorType} flooring`);
    if (masterToggles.lighting  && masterSelector.lighting      && masterSelector.lighting !== 'keep_original')      parts.push(`${masterSelector.lighting} lighting`);
    if (masterToggles.decor     && masterSelector.decorStyle    && masterSelector.decorStyle !== 'keep_original')    parts.push(`${masterSelector.decorStyle} decor style`);

    const designDesc = parts.length > 0 ? parts.join(', ') : 'refined interior design';

    positivePrompt = [
      '(professional architectural interior photography:1.4)',
      '(preserve exact original room structure walls windows doors:1.5)',
      '(maintain same room dimensions and layout:1.3)',
      roomDesc,
      designDesc,
      'sharp focus throughout',
      'realistic textures and materials',
      'professional lighting setup',
      'ultra high detail 8k resolution',
      'interior design magazine quality',
    ].join(', ');
  } else {
    // ── Prompt: Standard style/color mode ─────────────────────────────────────
    positivePrompt = [
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
      'interior design magazine quality',
    ].join(', ');
  }

  negativePrompt = [
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
    'outdoor scene',
  ].join(', ');

  // ── Assemble pure-JSON workflow (no placeholders) ─────────────────────────
  const workflow = {
    "1": {
      "class_type": "LoadImage",
      "inputs": { "image": path.basename(imageFilename) }
    },
    "2": {
      "class_type": "CheckpointLoaderSimple",
      "inputs": { "ckpt_name": "sd_xl_base_1.0.safetensors" }
    },
    "3": {
      "class_type": "CLIPTextEncode",
      "inputs": { "clip": ["2", 1], "text": positivePrompt }
    },
    "4": {
      "class_type": "CLIPTextEncode",
      "inputs": { "clip": ["2", 1], "text": negativePrompt }
    },
    "5": {
      "class_type": "VAEEncode",
      "inputs": { "pixels": ["1", 0], "vae": ["2", 2] }
    },
    "9": {
      "class_type": "Canny",
      "inputs": {
        "image":          ["1", 0],
        "low_threshold":  0.4,
        "high_threshold": 0.8
      }
    },
    "10": {
      "class_type": "ControlNetLoader",
      "inputs": { "control_net_name": "controlnet-canny-sdxl.safetensors" }
    },
    "11": {
      "class_type": "ControlNetApplyAdvanced",
      "inputs": {
        "control_net":   ["10", 0],
        "image":         ["9", 0],
        "positive":      ["3", 0],
        "negative":      ["4", 0],
        "strength":      useControlNet ? 0.65 : 0.0,
        "start_percent": 0.10,
        "end_percent":   useControlNet ? 0.65 : 0.0,
      }
    },
    "6": {
      "class_type": "KSampler",
      "inputs": {
        "model":        ["2", 0],
        "positive":     ["11", 0],
        "negative":     ["11", 1],
        "latent_image": ["5", 0],
        "seed":         seed ?? Math.floor(Math.random() * 999999999),
        "steps":        20,
        "cfg":          7.5,
        "sampler_name": "dpmpp_2m",
        "scheduler":    "karras",
        "denoise":      denoise,
      }
    },
    "7": {
      "class_type": "VAEDecode",
      "inputs": { "samples": ["6", 0], "vae": ["2", 2] }
    },
    "8": {
      "class_type": "SaveImage",
      "inputs": { "images": ["7", 0], "filename_prefix": "removation_" }
    },
  };

  return { workflow, positivePrompt };
}

// ─── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(request) {
  await connectDB();
  try {
    console.log('🎨 Starting room redesign...');

    const formData = await request.formData();
    const imageFile = formData.get('image');

    const rawData   = formData.get('data');
    const parsedData = rawData ? JSON.parse(rawData) : {};

    const style        = parsedData.style        || formData.get('style')        || 'Modern';
    const roomType     = parsedData.roomType      || formData.get('roomType')     || 'Living Room';
    const colorPalette = parsedData.colorPalette  || formData.get('colorPalette') || 'Neutral';
    const changeLevel  = parsedData.changeLevel   || formData.get('changeLevel')  || 'medium';
    const masterSelector = parsedData.masterSelector || null;
    const masterToggles  = parsedData.masterToggles  || null;
    const useControlNetRaw = parsedData.useControlNet ?? formData.get('useControlNet');
    const useControlNet = useControlNetRaw === false || useControlNetRaw === 'false' ? false : true;

    if (!imageFile) {
      return Response.json({ error: 'No image provided' }, { status: 400 });
    }

    // Save uploaded image to Next.js uploads dir
    const bytes  = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });
    const uploadFilename = `redesign_${Date.now()}_${imageFile.name}`;
    const uploadPath = path.join(uploadsDir, uploadFilename);
    await writeFile(uploadPath, buffer);

    // Copy to ComfyUI input folder (ComfyUI requires the image here)
    const comfyInputDir = '/home/nikhil/Documents/Remo2/ComfyUI/input';
    await mkdir(comfyInputDir, { recursive: true });
    const comfyFilename = uploadFilename;
    const comfyInputPath = path.join(comfyInputDir, comfyFilename);
    await copyFile(uploadPath, comfyInputPath);
    console.log(`✅ Image copied to ComfyUI: ${comfyFilename}`);

    // Create project record
    const projectName = masterSelector
      ? `Master Design - ${roomType}`
      : `${style} ${roomType}`;

    const project = await Project.create({
      name:          projectName,
      userId:        '000000000000000000000000',
      originalImage: `/uploads/${uploadFilename}`,
      status:        'queued',
      processingType: 'redesign',
      aiConfig: {
        style,
        roomType,
        colorPalette,
        changeLevel,
        masterSelector,
        masterToggles,
        useControlNet,
        seed: Math.floor(Math.random() * 999999999),
      },
    });

    // Build and submit workflow
    const { workflow, positivePrompt } = buildRedesignWorkflow({
      imageFilename: comfyFilename,
      style,
      roomType,
      colorPalette,
      changeLevel,
      seed:  project.aiConfig.seed,
      masterSelector,
      masterToggles,
      useControlNet,
    });

    await comfyBridge.enqueueJob(project._id.toString(), workflow);
    console.log(`✅ Redesign job queued: ${project._id}`);
    console.log(`📝 Prompt: ${positivePrompt.substring(0, 120)}...`);

    return Response.json({
      success:         true,
      projectId:       project._id,
      promptId:        project._id,
      status:          'queued',
      message:         'Generation started',
      mode:            masterSelector ? 'master' : 'redesign',
      estimatedTime:   60,
      generatedPrompt: positivePrompt,
      useControlNet,
    });

  } catch (error) {
    console.error('❌ Redesign API error:', error);
    return Response.json(
      { error: 'Generation failed', message: error.message },
      { status: 500 }
    );
  }
}

// ─── GET Handler (polling) ────────────────────────────────────────────────────

export async function GET(request) {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  if (!projectId) {
    return Response.json({ message: 'Project ID required' }, { status: 400 });
  }

  const project = await Project.findById(projectId);
  if (!project) {
    return Response.json({ error: 'Project not found' }, { status: 404 });
  }
  return Response.json(project);
}

// ─── DELETE Handler ───────────────────────────────────────────────────────────

export async function DELETE(request) {
  await connectDB();
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
