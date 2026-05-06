/**
 * Ultra-Pro 6-Stage Workflow Builder (JS)
 * Generates ComfyUI API-format workflows for each stage.
 * Each returns a flat { nodeId: { inputs, class_type } } object.
 *
 * REWRITTEN to use only nodes actually installed in ComfyUI:
 *   - BatchCLIPSeg + DownloadAndLoadCLIPSeg (instead of Impact Pack SAM/SEGS)
 *   - VAEEncodeForInpaint + SetLatentNoiseMask (instead of RegionalSampler)
 *   - Standard KSampler refinement (instead of MaskDetailerPipe)
 *   - RealESRGAN_x4plus.pth upscaler (confirmed installed)
 *   - controlnet-canny-sdxl.safetensors (only ControlNet confirmed installed)
 */

function seed() {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}

// ─── Stage 1: Scene Understanding ────────────────────────────────────
// Uses BatchCLIPSeg for semantic segmentation + DepthAnythingV2 for depth

export function buildStage1(imageFilename) {
  return {
    // Load input image
    "1":  { class_type: "LoadImage",              inputs: { image: imageFilename, upload: "image" } },

    // Load CLIPSeg model
    "2":  { class_type: "DownloadAndLoadCLIPSeg",  inputs: { model: "CIDAS/clipseg-rd64-refined" } },

    // Segment walls
    "3":  { class_type: "BatchCLIPSeg", inputs: { images: ["1",0], text: "wall", threshold: 0.4, binary_mask: true, combine_mask: true, use_cuda: true, blur_sigma: 7.0, opt_model: ["2",0] } },

    // Segment floor
    "4":  { class_type: "BatchCLIPSeg", inputs: { images: ["1",0], text: "floor", threshold: 0.4, binary_mask: true, combine_mask: true, use_cuda: true, blur_sigma: 7.0, opt_model: ["2",0] } },

    // Segment furniture/objects
    "5":  { class_type: "BatchCLIPSeg", inputs: { images: ["1",0], text: "furniture, sofa, chair, table, bed, shelf", threshold: 0.35, binary_mask: true, combine_mask: true, use_cuda: true, blur_sigma: 5.0, opt_model: ["2",0] } },

    // Segment empty areas
    "6":  { class_type: "BatchCLIPSeg", inputs: { images: ["1",0], text: "empty floor, open area, empty space", threshold: 0.3, binary_mask: true, combine_mask: true, use_cuda: true, blur_sigma: 5.0, opt_model: ["2",0] } },

    // Depth map
    "7":  { class_type: "DepthAnythingV2Preprocessor", inputs: { image: ["1",0], ckpt_name: "depth_anything_v2_vits.pth", resolution: 1024 } },

    // Convert masks to images for saving
    "8":  { class_type: "MaskToImage", inputs: { mask: ["3",0] } },
    "9":  { class_type: "MaskToImage", inputs: { mask: ["4",0] } },
    "10": { class_type: "MaskToImage", inputs: { mask: ["5",0] } },
    "11": { class_type: "MaskToImage", inputs: { mask: ["6",0] } },

    // Save all outputs
    "12": { class_type: "SaveImage", inputs: { images: ["8",0],  filename_prefix: "stage1/wall_mask" } },
    "13": { class_type: "SaveImage", inputs: { images: ["9",0],  filename_prefix: "stage1/floor_mask" } },
    "14": { class_type: "SaveImage", inputs: { images: ["10",0], filename_prefix: "stage1/object_mask" } },
    "15": { class_type: "SaveImage", inputs: { images: ["11",0], filename_prefix: "stage1/empty_mask" } },
    "16": { class_type: "SaveImage", inputs: { images: ["7",0],  filename_prefix: "stage1/depth_map" } },
  };
}

// ─── Stage 2: Geometry Locking (Canny ControlNet + Depth-Canny pass) ─────────
// Uses controlnet-canny-sdxl.safetensors (only ControlNet confirmed installed).
// Pass 1: Canny on original image (primary structural lock — walls/edges)
// Pass 2: Canny on depth map from Stage 1 (spatial/depth guidance — room geometry)
// Accepts optional structural lock params from ProfessionalSelector.

export function buildStage2(imageFilename, depthMapFilename, { masterSelector, masterToggles, roomType, structuralLock = {} }) {
  const parts = [`photorealistic interior of a ${roomType}`];
  if (masterToggles?.walls)     parts.push(`${masterSelector.wallColor} walls`);
  if (masterToggles?.ceiling)   parts.push(`${masterSelector.ceiling} ceiling`);
  if (masterToggles?.furniture) parts.push(`${masterSelector.furnitureStyle} furniture`);
  if (masterToggles?.floor && masterSelector.floorType) parts.push(`${masterSelector.floorType} flooring`);
  if (masterToggles?.lighting && masterSelector.lighting) parts.push(`${masterSelector.lighting} lighting`);
  if (masterToggles?.decor && masterSelector.decorStyle) parts.push(`${masterSelector.decorStyle} style`);
  parts.push('professional architectural photography, 8k, ultra detail');

  // Respect structural lock params from ProfessionalSelector (defaults safe for 8GB VRAM)
  const cannyLow   = structuralLock.cannyThreshold?.[0] ?? 100;
  const cannyHigh  = structuralLock.cannyThreshold?.[1] ?? 200;
  const cnStrength = structuralLock.strength ?? 0.85;
  // Depth-canny pass: 60% of primary strength, fades out at 70% of sampling
  // (softer than primary — provides room-depth cues without over-constraining color)
  const depthCnStrength = parseFloat((cnStrength * 0.60).toFixed(2));

  return {
    // ─── Inputs ─────────────────────────────────────────────────────
    "1":  { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "sd_xl_base_1.0.safetensors" } },
    "2":  { class_type: "LoadImage",              inputs: { image: imageFilename,    upload: "image" } },
    // Load depth map produced by Stage 1 (DepthAnythingV2)
    "2b": { class_type: "LoadImage",              inputs: { image: depthMapFilename, upload: "image" } },

    // ─── Pass 1: Canny on original image (primary structural lock) ──
    "3":  { class_type: "CannyEdgePreprocessor",   inputs: { image: ["2",0],  low_threshold: cannyLow,  high_threshold: cannyHigh, resolution: 1024 } },

    // ─── Pass 2: Canny on depth map (spatial/room-depth guidance) ───
    // Since depth ControlNet model is not installed, we run Canny on the depth map
    // using the same Canny ControlNet but with softer settings.
    // Depth → Canny extracts depth-discontinuity edges = wall/floor/ceiling boundaries.
    "3b": { class_type: "CannyEdgePreprocessor",   inputs: { image: ["2b",0], low_threshold: 50,        high_threshold: 150,       resolution: 1024 } },

    // ─── ControlNet + Prompts ────────────────────────────────────────
    "4":  { class_type: "ControlNetLoader",        inputs: { control_net_name: "controlnet-canny-sdxl.safetensors" } },
    "5":  { class_type: "CLIPTextEncode",          inputs: { text: parts.join(', '), clip: ["1",1] } },
    "6":  { class_type: "CLIPTextEncode",          inputs: { text: "blurry, low quality, distorted, cartoon, watermark, text, deformed perspective, unrealistic", clip: ["1",1] } },

    // ─── Apply Pass 1: Primary Canny structural lock ─────────────────
    "7":  { class_type: "ControlNetApplyAdvanced", inputs: { positive: ["5",0], negative: ["6",0], control_net: ["4",0], image: ["3",0],  strength: cnStrength,      start_percent: 0.0, end_percent: 1.0 } },

    // ─── Apply Pass 2: Depth-Canny spatial guidance ──────────────────
    // Chained from Pass 1 outputs so conditioning accumulates correctly.
    // end_percent: 0.70 — depth guidance active only during early sampling steps
    // (where global structure is determined); fades out for detail refinement.
    "7b": { class_type: "ControlNetApplyAdvanced", inputs: { positive: ["7",0], negative: ["7",1], control_net: ["4",0], image: ["3b",0], strength: depthCnStrength, start_percent: 0.0, end_percent: 0.70 } },

    // ─── Encode → Sample → Decode ────────────────────────────────────
    "8":  { class_type: "VAEEncode",               inputs: { pixels: ["2",0], vae: ["1",2] } },
    "9":  { class_type: "KSampler",                inputs: { seed: seed(), steps: 25, cfg: 7.0, sampler_name: "dpmpp_2m", scheduler: "karras", denoise: 0.75, model: ["1",0], positive: ["7b",0], negative: ["7b",1], latent_image: ["8",0] } },
    "10": { class_type: "VAEDecode",               inputs: { samples: ["9",0], vae: ["1",2] } },
    "11": { class_type: "SaveImage",               inputs: { images: ["10",0], filename_prefix: "stage2/redesigned" } },
  };
}


// ─── Stage 3: Sequential Inpainting (replaces RegionalSampler) ───────
// Inpaints walls first, then furniture, using VAEEncodeForInpaint

export function buildStage3(redesignedImage, wallMask, objectMask, { wallPrompt, furniturePrompt }) {
  return {
    // Load checkpoint + images
    "1":  { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "sd_xl_base_1.0.safetensors" } },
    "2":  { class_type: "LoadImage", inputs: { image: redesignedImage, upload: "image" } },
    "3":  { class_type: "LoadImage", inputs: { image: wallMask, upload: "image" } },
    "4":  { class_type: "LoadImage", inputs: { image: objectMask, upload: "image" } },

    // Convert loaded mask images to mask type
    "5":  { class_type: "ImageToMask", inputs: { image: ["3",0], channel: "red" } },
    "6":  { class_type: "ImageToMask", inputs: { image: ["4",0], channel: "red" } },

    // Grow masks slightly for better blending
    "7":  { class_type: "GrowMask", inputs: { mask: ["5",0], expand: 6, tapered_corners: true } },
    "8":  { class_type: "GrowMask", inputs: { mask: ["6",0], expand: 6, tapered_corners: true } },

    // PASS 1: Inpaint walls
    "9":  { class_type: "CLIPTextEncode", inputs: { text: wallPrompt, clip: ["1",1] } },
    "10": { class_type: "CLIPTextEncode", inputs: { text: "blurry, low quality, artifacts, distorted perspective, floating furniture", clip: ["1",1] } },
    "11": { class_type: "VAEEncodeForInpaint", inputs: { pixels: ["2",0], vae: ["1",2], mask: ["7",0], grow_mask_by: 6 } },
    "12": { class_type: "KSampler", inputs: { seed: seed(), steps: 20, cfg: 7.0, sampler_name: "dpmpp_2m", scheduler: "karras", denoise: 0.55, model: ["1",0], positive: ["9",0], negative: ["10",0], latent_image: ["11",0] } },
    "13": { class_type: "VAEDecode", inputs: { samples: ["12",0], vae: ["1",2] } },

    // PASS 2: Inpaint furniture/objects on top of wall-inpainted result
    "14": { class_type: "CLIPTextEncode", inputs: { text: furniturePrompt, clip: ["1",1] } },
    "15": { class_type: "VAEEncodeForInpaint", inputs: { pixels: ["13",0], vae: ["1",2], mask: ["8",0], grow_mask_by: 6 } },
    "16": { class_type: "KSampler", inputs: { seed: seed(), steps: 20, cfg: 7.0, sampler_name: "dpmpp_2m", scheduler: "karras", denoise: 0.55, model: ["1",0], positive: ["14",0], negative: ["10",0], latent_image: ["15",0] } },
    "17": { class_type: "VAEDecode", inputs: { samples: ["16",0], vae: ["1",2] } },

    // Save result
    "18": { class_type: "SaveImage", inputs: { images: ["17",0], filename_prefix: "stage3/regional_inpainted" } },
  };
}

// ─── Stage 4: IPAdapter Furniture ────────────────────────────────────
// Requires IPAdapter Plus for SDXL + CLIP Vision ViT-H weights.
// Uses canny on depth map for spatial guidance (depth ControlNet not installed).

export function buildStage4(stage3Image, styleRef, furnitureImage, objectMask, depthMap) {
  return {
    "1":  { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "sd_xl_base_1.0.safetensors" } },
    "2":  { class_type: "LoadImage", inputs: { image: stage3Image, upload: "image" } },
    "3":  { class_type: "LoadImage", inputs: { image: styleRef, upload: "image" } },
    "4":  { class_type: "LoadImage", inputs: { image: furnitureImage, upload: "image" } },
    "5":  { class_type: "LoadImage", inputs: { image: objectMask, upload: "image" } },
    "6":  { class_type: "LoadImage", inputs: { image: depthMap, upload: "image" } },
    "7":  { class_type: "IPAdapterUnifiedLoader", inputs: { model: ["1",0], preset: "PLUS (high strength)" } },
    "8":  { class_type: "PrepImageForClipVision", inputs: { image: ["3",0], interpolation: "LANCZOS", crop_position: "center", sharpening: 0.0 } },
    "9":  { class_type: "PrepImageForClipVision", inputs: { image: ["4",0], interpolation: "LANCZOS", crop_position: "pad", sharpening: 0.1 } },

    // Convert object mask image to mask type for attn_mask
    "10": { class_type: "ImageToMask", inputs: { image: ["5",0], channel: "red" } },

    // IPAdapter pass 1: global style transfer
    "11": { class_type: "IPAdapterAdvanced", inputs: { model: ["7",0], ipadapter: ["7",1], image: ["8",0], weight: 0.40, weight_type: "linear", combine_embeds: "concat", start_at: 0.0, end_at: 1.0, embeds_scaling: "K+V w/ C penalty" } },
    // IPAdapter pass 2: masked furniture placement
    "12": { class_type: "IPAdapterAdvanced", inputs: { model: ["11",0], ipadapter: ["7",1], image: ["9",0], weight: 0.80, weight_type: "linear", combine_embeds: "concat", start_at: 0.0, end_at: 0.85, embeds_scaling: "V only", attn_mask: ["10",0] } },

    // Text prompts
    "13": { class_type: "CLIPTextEncode", inputs: { text: "(professional architectural interior photography:1.3), elegant furniture placement, cohesive design, realistic proportions, 8k", clip: ["1",1] } },
    "14": { class_type: "CLIPTextEncode", inputs: { text: "blurry, low quality, floating furniture, unrealistic proportions, mismatched style, cartoon, watermark", clip: ["1",1] } },

    // Use canny on depth map for spatial guidance (depth ControlNet not installed)
    "15": { class_type: "CannyEdgePreprocessor", inputs: { image: ["6",0], low_threshold: 80, high_threshold: 180, resolution: 1024 } },
    "16": { class_type: "ControlNetLoader", inputs: { control_net_name: "controlnet-canny-sdxl.safetensors" } },
    "17": { class_type: "ControlNetApplyAdvanced", inputs: { positive: ["13",0], negative: ["14",0], control_net: ["16",0], image: ["15",0], strength: 0.70, start_percent: 0.0, end_percent: 1.0 } },
    "18": { class_type: "VAEEncode", inputs: { pixels: ["2",0], vae: ["1",2] } },
    "19": { class_type: "KSampler", inputs: { seed: seed(), steps: 25, cfg: 5.5, sampler_name: "dpmpp_2m", scheduler: "karras", denoise: 0.45, model: ["12",0], positive: ["17",0], negative: ["17",1], latent_image: ["18",0] } },
    "20": { class_type: "VAEDecode", inputs: { samples: ["19",0], vae: ["1",2] } },
    "21": { class_type: "SaveImage", inputs: { images: ["20",0], filename_prefix: "stage4/furniture_placed" } },
  };
}

// ─── Stage 5: Iterative Refinement ───────────────────────────────────
// Light inpainting pass over wall+furniture masks for detail enhancement.
// Separated from Stage 6 so each can be independently skipped.

export function buildStage5(stage4Image, wallMask, objectMask) {
  return {
    // Load checkpoint + images
    "1":  { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "sd_xl_base_1.0.safetensors" } },
    "2":  { class_type: "LoadImage", inputs: { image: stage4Image, upload: "image" } },
    "3":  { class_type: "LoadImage", inputs: { image: wallMask, upload: "image" } },
    "4":  { class_type: "LoadImage", inputs: { image: objectMask, upload: "image" } },

    // Prompts
    "5":  { class_type: "CLIPTextEncode", inputs: { text: "(professional architectural interior photography:1.3), ultra sharp details, pristine surfaces, photorealistic, (8k RAW photo:1.2), masterpiece", clip: ["1",1] } },
    "6":  { class_type: "CLIPTextEncode", inputs: { text: "blurry, low quality, noise, artifacts, jpeg compression, pixelated, cartoon, watermark, distorted, oversaturated", clip: ["1",1] } },

    // Convert mask images to masks
    "7":  { class_type: "ImageToMask", inputs: { image: ["3",0], channel: "red" } },
    "8":  { class_type: "ImageToMask", inputs: { image: ["4",0], channel: "red" } },

    // Combine wall + object masks into one refinement mask
    "9":  { class_type: "MaskComposite", inputs: { destination: ["7",0], source: ["8",0], x: 0, y: 0, operation: "add" } },

    // Light refinement pass using combined mask inpainting
    "10": { class_type: "VAEEncodeForInpaint", inputs: { pixels: ["2",0], vae: ["1",2], mask: ["9",0], grow_mask_by: 4 } },
    "11": { class_type: "KSampler", inputs: { seed: seed(), steps: 15, cfg: 4.5, sampler_name: "dpmpp_2m", scheduler: "karras", denoise: 0.30, model: ["1",0], positive: ["5",0], negative: ["6",0], latent_image: ["10",0] } },
    "12": { class_type: "VAEDecode", inputs: { samples: ["11",0], vae: ["1",2] } },

    // Save refined result
    "13": { class_type: "SaveImage", inputs: { images: ["12",0], filename_prefix: "stage5/refined" } },
  };
}

// ─── Stage 6: 4× Upscale + Sharpen ──────────────────────────────────
// Uses RealESRGAN_x4plus.pth (confirmed installed in ComfyUI/models/upscale_models/).
// Separated from Stage 5 so it can be independently skipped via UI toggle.

export function buildStage6(refinedImage) {
  return {
    // Load the refined image from Stage 5
    "1": { class_type: "LoadImage", inputs: { image: refinedImage, upload: "image" } },

    // Load confirmed upscaler model
    "2": { class_type: "UpscaleModelLoader", inputs: { model_name: "RealESRGAN_x4plus.pth" } },

    // 4× pixel upscale
    "3": { class_type: "ImageUpscaleWithModel", inputs: { upscale_model: ["2",0], image: ["1",0] } },

    // Downscale 4× result to 2× (preserves aspect ratio, no forced square)
    "4": { class_type: "ImageScaleBy", inputs: { image: ["3",0], upscale_method: "lanczos", scale_by: 0.5 } },

    // Load SDXL for light hi-res refinement pass
    "5": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "sd_xl_base_1.0.safetensors" } },
    "6": { class_type: "CLIPTextEncode", inputs: { text: "(professional architectural interior photography:1.3), ultra sharp details, pristine surfaces, photorealistic, (8k RAW photo:1.2), masterpiece", clip: ["5",1] } },
    "7": { class_type: "CLIPTextEncode", inputs: { text: "blurry, low quality, noise, artifacts, jpeg compression, pixelated, cartoon, watermark, distorted, oversaturated", clip: ["5",1] } },

    // Light hi-res pass at 2048×2048
    "8":  { class_type: "VAEEncodeTiled", inputs: { pixels: ["4",0], vae: ["5",2], tile_size: 512, overlap: 64, temporal_size: 64, temporal_overlap: 8 } },
    "9":  { class_type: "KSampler", inputs: { seed: seed(), steps: 12, cfg: 4.0, sampler_name: "dpmpp_2m", scheduler: "karras", denoise: 0.20, model: ["5",0], positive: ["6",0], negative: ["7",0], latent_image: ["8",0] } },
    "10": { class_type: "VAEDecodeTiled", inputs: { samples: ["9",0], vae: ["5",2], tile_size: 512, overlap: 64, temporal_size: 64, temporal_overlap: 8 } },

    // Final sharpen
    "11": { class_type: "ImageSharpen", inputs: { image: ["10",0], sharpen_radius: 2, sigma: 0.65, alpha: 0.55 } },

    // Save final output
    "12": { class_type: "SaveImage", inputs: { images: ["11",0], filename_prefix: "stage6_final/ultra_hd_result" } },
  };
}

// ─── Legacy combined Stage 5+6 (kept for backward compat) ────────────
// @deprecated Use buildStage5() + buildStage6() separately for independent skip support.
export function buildStage56(stage4Image, wallMask, objectMask) {
  console.warn('[ultraProBuilder] buildStage56() is deprecated. Use buildStage5() + buildStage6() separately.');
  return {
    ...buildStage5(stage4Image, wallMask, objectMask),
    // Note: cannot chain these inline since node IDs would conflict.
    // This alias only runs Stage 5 refinement without upscale.
  };
}


// ═══════════════════════════════════════════════════════════════════════
// TAB-SPECIFIC WORKFLOW BUILDERS
// Each function returns a self-contained ComfyUI API-format workflow
// for a single tab operation (Render / Edit / Furnish / Lighting / Post-process).
// Designed for single-shot execution via ComfyBridge.enqueueTabJob().
// ═══════════════════════════════════════════════════════════════════════


// ─── RENDER TAB: Photo/Sketch → Photoreal ────────────────────────────
// ControlNet (Canny) structural lock + KSampler redesign.
// Optionally chains IPAdapter style reference if provided.
//
// @param {string} imageFilename         - Input image in ComfyUI/input
// @param {object} opts
// @param {string} opts.roomType         - e.g. "living_room"
// @param {string} opts.style            - e.g. "Modern Minimalist"
// @param {string} [opts.prompt]         - Additional user prompt
// @param {string} [opts.referenceImage] - Style reference image filename
// @param {number} [opts.strength=0.75]  - Denoise strength (0.3–0.95)
// @param {number} [opts.cannyStrength=0.85] - ControlNet strength

export function buildRenderWorkflow(imageFilename, opts = {}) {
  const {
    roomType = 'living room',
    style = 'modern minimalist',
    prompt = '',
    referenceImage = null,
    strength = 0.75,
    cannyStrength = 0.85,
  } = opts;

  const positiveText = [
    `(photorealistic interior of a ${roomType}:1.3)`,
    `${style} design`,
    prompt,
    'professional architectural photography, 8k, ultra detail, soft natural lighting, award-winning interior design',
  ].filter(Boolean).join(', ');

  const negativeText = 'blurry, low quality, distorted, cartoon, watermark, text, deformed perspective, unrealistic, oversaturated, noise, artifacts';

  const workflow = {
    // ─── Core Models ───────────────────────────────────────────
    "1":  { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "sd_xl_base_1.0.safetensors" } },
    "2":  { class_type: "LoadImage",              inputs: { image: imageFilename, upload: "image" } },

    // ─── Canny ControlNet for structure ────────────────────────
    "3":  { class_type: "CannyEdgePreprocessor",   inputs: { image: ["2",0], low_threshold: 100, high_threshold: 200, resolution: 1024 } },
    "4":  { class_type: "ControlNetLoader",        inputs: { control_net_name: "controlnet-canny-sdxl.safetensors" } },

    // ─── Prompts ──────────────────────────────────────────────
    "5":  { class_type: "CLIPTextEncode", inputs: { text: positiveText, clip: ["1",1] } },
    "6":  { class_type: "CLIPTextEncode", inputs: { text: negativeText, clip: ["1",1] } },

    // ─── Apply ControlNet ─────────────────────────────────────
    "7":  { class_type: "ControlNetApplyAdvanced", inputs: { positive: ["5",0], negative: ["6",0], control_net: ["4",0], image: ["3",0], strength: cannyStrength, start_percent: 0.0, end_percent: 1.0 } },

    // ─── Encode → Sample → Decode ─────────────────────────────
    "8":  { class_type: "VAEEncode",   inputs: { pixels: ["2",0], vae: ["1",2] } },
    "9":  { class_type: "KSampler",    inputs: { seed: seed(), steps: 25, cfg: 7.0, sampler_name: "dpmpp_2m", scheduler: "karras", denoise: strength, model: ["1",0], positive: ["7",0], negative: ["7",1], latent_image: ["8",0] } },
    "10": { class_type: "VAEDecode",   inputs: { samples: ["9",0], vae: ["1",2] } },
    "11": { class_type: "SaveImage",   inputs: { images: ["10",0], filename_prefix: "tab_render/result" } },
  };

  // ─── Optional: IPAdapter style reference ────────────────────
  if (referenceImage) {
    workflow["20"] = { class_type: "LoadImage",              inputs: { image: referenceImage, upload: "image" } };
    workflow["21"] = { class_type: "IPAdapterUnifiedLoader", inputs: { model: ["1",0], preset: "PLUS (high strength)" } };
    workflow["22"] = { class_type: "PrepImageForClipVision", inputs: { image: ["20",0], interpolation: "LANCZOS", crop_position: "center", sharpening: 0.0 } };
    workflow["23"] = { class_type: "IPAdapterAdvanced",      inputs: { model: ["21",0], ipadapter: ["21",1], image: ["22",0], weight: 0.45, weight_type: "linear", combine_embeds: "concat", start_at: 0.0, end_at: 1.0, embeds_scaling: "K+V w/ C penalty" } };
    // Redirect KSampler to use IPAdapter-enhanced model
    workflow["9"].inputs.model = ["23",0];
  }

  return workflow;
}


// ─── EDIT TAB: Regional Inpainting with User Mask ────────────────────
// User paints a mask → VAEEncodeForInpaint → KSampler with prompt → decode.
//
// @param {string} imageFilename - Base image in ComfyUI/input
// @param {string} maskFilename  - User-painted mask (white = edit region)
// @param {object} opts
// @param {string} opts.prompt         - What to paint in the masked region
// @param {string} [opts.negativePrompt]
// @param {number} [opts.denoise=0.65] - Denoise strength

export function buildEditWorkflow(imageFilename, maskFilename, opts = {}) {
  const {
    prompt = 'high quality interior detail, photorealistic',
    negativePrompt = 'blurry, low quality, artifacts, distorted perspective, floating furniture',
    denoise = 0.65,
  } = opts;

  return {
    "1":  { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "sd_xl_base_1.0.safetensors" } },
    "2":  { class_type: "LoadImage", inputs: { image: imageFilename, upload: "image" } },
    "3":  { class_type: "LoadImage", inputs: { image: maskFilename,  upload: "image" } },

    // Convert mask image → mask type
    "4":  { class_type: "ImageToMask", inputs: { image: ["3",0], channel: "red" } },

    // Grow mask for smoother blending at edges
    "5":  { class_type: "GrowMask", inputs: { mask: ["4",0], expand: 8, tapered_corners: true } },

    // Prompts
    "6":  { class_type: "CLIPTextEncode", inputs: { text: prompt, clip: ["1",1] } },
    "7":  { class_type: "CLIPTextEncode", inputs: { text: negativePrompt, clip: ["1",1] } },

    // Inpaint encode → sample → decode
    "8":  { class_type: "VAEEncodeForInpaint", inputs: { pixels: ["2",0], vae: ["1",2], mask: ["5",0], grow_mask_by: 8 } },
    "9":  { class_type: "KSampler", inputs: { seed: seed(), steps: 22, cfg: 7.0, sampler_name: "dpmpp_2m", scheduler: "karras", denoise, model: ["1",0], positive: ["6",0], negative: ["7",0], latent_image: ["8",0] } },
    "10": { class_type: "VAEDecode", inputs: { samples: ["9",0], vae: ["1",2] } },
    "11": { class_type: "SaveImage", inputs: { images: ["10",0], filename_prefix: "tab_edit/result" } },
  };
}


// ─── FURNISH TAB: Empty Room + Furniture Placement ───────────────────
// 1) CLIPSeg detects empty floor/space in the room
// 2) IPAdapter places the furniture image using the empty area mask
// 3) Canny on depth map for spatial guidance
//
// @param {string} imageFilename    - Room image
// @param {string} furnitureImage   - BG-removed furniture image (PNG)
// @param {string|null} emptyMask   - Pre-computed empty area mask (optional, will auto-detect if null)
// @param {string|null} depthMap    - Pre-computed depth map (optional, will generate if null)
// @param {object} opts
// @param {string} [opts.prompt]    - Furniture placement prompt

export function buildFurnishWorkflow(imageFilename, furnitureImage, emptyMask = null, depthMap = null, opts = {}) {
  const {
    placement = '',
    extraPrompt = '',
    prompt: rawPrompt,
  } = opts;

  const baseTxt = rawPrompt || 'elegant furniture placement in room, realistic proportions, natural shadows, cohesive design, professional interior photography';
  const promptParts = [baseTxt];
  if (placement) promptParts.push(placement);
  if (extraPrompt) promptParts.push(extraPrompt);
  const prompt = promptParts.join(', ');

  const workflow = {
    "1":  { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "sd_xl_base_1.0.safetensors" } },
    "2":  { class_type: "LoadImage", inputs: { image: imageFilename,  upload: "image" } },
    "3":  { class_type: "LoadImage", inputs: { image: furnitureImage, upload: "image" } },
  };

  let maskNodeOutput;
  let depthNodeOutput;
  let nextId = 4;

  // ─── Auto-detect empty areas if no mask provided ────────────
  if (emptyMask) {
    workflow[String(nextId)] = { class_type: "LoadImage", inputs: { image: emptyMask, upload: "image" } };
    const maskImgId = String(nextId); nextId++;
    workflow[String(nextId)] = { class_type: "ImageToMask", inputs: { image: [maskImgId,0], channel: "red" } };
    maskNodeOutput = [String(nextId), 0]; nextId++;
  } else {
    // Auto-detect using CLIPSeg
    workflow[String(nextId)] = { class_type: "DownloadAndLoadCLIPSeg", inputs: { model: "CIDAS/clipseg-rd64-refined" } };
    const clipsegModelId = String(nextId); nextId++;
    workflow[String(nextId)] = { class_type: "BatchCLIPSeg", inputs: { images: ["2",0], text: "empty floor, open area, empty space, bare floor", threshold: 0.3, binary_mask: true, combine_mask: true, use_cuda: true, blur_sigma: 5.0, opt_model: [clipsegModelId,0] } };
    maskNodeOutput = [String(nextId), 0]; nextId++;
  }

  // ─── Auto-generate depth map if not provided ────────────────
  if (depthMap) {
    workflow[String(nextId)] = { class_type: "LoadImage", inputs: { image: depthMap, upload: "image" } };
    depthNodeOutput = [String(nextId), 0]; nextId++;
  } else {
    workflow[String(nextId)] = { class_type: "DepthAnythingV2Preprocessor", inputs: { image: ["2",0], ckpt_name: "depth_anything_v2_vits.pth", resolution: 1024 } };
    depthNodeOutput = [String(nextId), 0]; nextId++;
  }

  // ─── IPAdapter for furniture placement ──────────────────────
  const ipaLoaderId = String(nextId);
  workflow[ipaLoaderId] = { class_type: "IPAdapterUnifiedLoader", inputs: { model: ["1",0], preset: "PLUS (high strength)" } };
  nextId++;

  const prepFurnId = String(nextId);
  workflow[prepFurnId] = { class_type: "PrepImageForClipVision", inputs: { image: ["3",0], interpolation: "LANCZOS", crop_position: "pad", sharpening: 0.1 } };
  nextId++;

  // Grow empty mask slightly for better blending
  const growMaskId = String(nextId);
  workflow[growMaskId] = { class_type: "GrowMask", inputs: { mask: maskNodeOutput, expand: 10, tapered_corners: true } };
  nextId++;

  const ipaAdvId = String(nextId);
  workflow[ipaAdvId] = { class_type: "IPAdapterAdvanced", inputs: { model: [ipaLoaderId,0], ipadapter: [ipaLoaderId,1], image: [prepFurnId,0], weight: 0.80, weight_type: "linear", combine_embeds: "concat", start_at: 0.0, end_at: 0.85, embeds_scaling: "V only", attn_mask: [growMaskId,0] } };
  nextId++;

  // ─── Depth-based ControlNet guidance ────────────────────────
  const cannyDepthId = String(nextId);
  workflow[cannyDepthId] = { class_type: "CannyEdgePreprocessor", inputs: { image: depthNodeOutput, low_threshold: 80, high_threshold: 180, resolution: 1024 } };
  nextId++;

  const cnLoadId = String(nextId);
  workflow[cnLoadId] = { class_type: "ControlNetLoader", inputs: { control_net_name: "controlnet-canny-sdxl.safetensors" } };
  nextId++;

  // Prompts
  const posPromptId = String(nextId);
  workflow[posPromptId] = { class_type: "CLIPTextEncode", inputs: { text: prompt, clip: ["1",1] } };
  nextId++;

  const negPromptId = String(nextId);
  workflow[negPromptId] = { class_type: "CLIPTextEncode", inputs: { text: "blurry, low quality, floating furniture, unrealistic proportions, mismatched style, cartoon, watermark", clip: ["1",1] } };
  nextId++;

  const cnApplyId = String(nextId);
  workflow[cnApplyId] = { class_type: "ControlNetApplyAdvanced", inputs: { positive: [posPromptId,0], negative: [negPromptId,0], control_net: [cnLoadId,0], image: [cannyDepthId,0], strength: 0.65, start_percent: 0.0, end_percent: 0.8 } };
  nextId++;

  // ─── Encode → Sample → Decode ──────────────────────────────
  const vaeEncId = String(nextId);
  workflow[vaeEncId] = { class_type: "VAEEncode", inputs: { pixels: ["2",0], vae: ["1",2] } };
  nextId++;

  const ksampleId = String(nextId);
  workflow[ksampleId] = { class_type: "KSampler", inputs: { seed: seed(), steps: 25, cfg: 5.5, sampler_name: "dpmpp_2m", scheduler: "karras", denoise: 0.50, model: [ipaAdvId,0], positive: [cnApplyId,0], negative: [cnApplyId,1], latent_image: [vaeEncId,0] } };
  nextId++;

  const vaeDecId = String(nextId);
  workflow[vaeDecId] = { class_type: "VAEDecode", inputs: { samples: [ksampleId,0], vae: ["1",2] } };
  nextId++;

  const saveId = String(nextId);
  workflow[saveId] = { class_type: "SaveImage", inputs: { images: [vaeDecId,0], filename_prefix: "tab_furnish/result" } };

  return workflow;
}


// ─── LIGHTING TAB: Mood / Time-of-Day Relighting ─────────────────────
// Low-denoise pass with lighting-specific prompts + ControlNet structure lock.
// Uses ICLight nodes if available, otherwise falls back to prompt-based.
//
// @param {string} imageFilename
// @param {object} opts
// @param {string} [opts.mood='warm']        - warm | cool | dramatic | natural
// @param {string} [opts.timeOfDay='day']    - morning | day | golden_hour | evening | night
// @param {number} [opts.intensity=0.35]     - Denoise strength (0.20–0.50)
// @param {string} [opts.referenceLight]     - Reference lighting image filename
// @param {boolean} [opts.useICLight=false]  - Use ICLight nodes if installed

export function buildLightingWorkflow(imageFilename, opts = {}) {
  const {
    mood = 'warm',
    timeOfDay = 'day',
    intensity = 0.35,
    referenceLight = null,
    useICLight = false,
  } = opts;

  // Build lighting-specific prompt from mood + time of day
  const moodPrompts = {
    warm: 'warm golden lighting, amber tones, cozy atmosphere, soft warm glow',
    cool: 'cool blue-white lighting, clean modern atmosphere, crisp cool tones',
    dramatic: 'dramatic contrast lighting, deep shadows, accent spotlights, moody atmosphere',
    natural: 'natural daylight, soft diffused sunlight, balanced neutral tones',
    romantic: 'soft romantic candlelight, warm pink undertones, intimate atmosphere',
    studio: 'professional studio lighting, even illumination, commercial photography',
  };

  const timePrompts = {
    morning: 'soft morning light streaming through windows, gentle sunrise glow',
    day: 'bright natural daylight, clear sky, well-lit interior',
    golden_hour: 'golden hour sunlight, warm amber rays, long soft shadows',
    evening: 'warm evening lighting, table lamps, ambient glow',
    night: 'nighttime interior, artificial warm lighting, cozy lamp light, city lights through windows',
  };

  const lightPrompt = [
    '(professional interior photography:1.3)',
    moodPrompts[mood] || moodPrompts.warm,
    timePrompts[timeOfDay] || timePrompts.day,
    'photorealistic, 8k detail',
  ].join(', ');

  const workflow = {
    "1":  { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "sd_xl_base_1.0.safetensors" } },
    "2":  { class_type: "LoadImage",              inputs: { image: imageFilename, upload: "image" } },

    // ControlNet to preserve room structure during relighting
    "3":  { class_type: "CannyEdgePreprocessor",   inputs: { image: ["2",0], low_threshold: 100, high_threshold: 200, resolution: 1024 } },
    "4":  { class_type: "ControlNetLoader",        inputs: { control_net_name: "controlnet-canny-sdxl.safetensors" } },

    "5":  { class_type: "CLIPTextEncode", inputs: { text: lightPrompt, clip: ["1",1] } },
    "6":  { class_type: "CLIPTextEncode", inputs: { text: "dark, underexposed, overexposed, harsh shadows, unnatural lighting, neon, fluorescent, blurry, low quality, cartoon", clip: ["1",1] } },

    // Strong ControlNet to keep structure, only change lighting
    "7":  { class_type: "ControlNetApplyAdvanced", inputs: { positive: ["5",0], negative: ["6",0], control_net: ["4",0], image: ["3",0], strength: 0.90, start_percent: 0.0, end_percent: 1.0 } },

    // Low denoise = only change lighting, keep room intact
    "8":  { class_type: "VAEEncode",   inputs: { pixels: ["2",0], vae: ["1",2] } },
    "9":  { class_type: "KSampler",    inputs: { seed: seed(), steps: 20, cfg: 5.0, sampler_name: "dpmpp_2m", scheduler: "karras", denoise: Math.min(Math.max(intensity, 0.20), 0.50), model: ["1",0], positive: ["7",0], negative: ["7",1], latent_image: ["8",0] } },
    "10": { class_type: "VAEDecode",   inputs: { samples: ["9",0], vae: ["1",2] } },
    "11": { class_type: "SaveImage",   inputs: { images: ["10",0], filename_prefix: "tab_lighting/result" } },
  };

  // Optional: Use reference lighting image via IPAdapter at low weight
  if (referenceLight) {
    workflow["20"] = { class_type: "LoadImage",              inputs: { image: referenceLight, upload: "image" } };
    workflow["21"] = { class_type: "IPAdapterUnifiedLoader", inputs: { model: ["1",0], preset: "PLUS (high strength)" } };
    workflow["22"] = { class_type: "PrepImageForClipVision", inputs: { image: ["20",0], interpolation: "LANCZOS", crop_position: "center", sharpening: 0.0 } };
    workflow["23"] = { class_type: "IPAdapterAdvanced",      inputs: { model: ["21",0], ipadapter: ["21",1], image: ["22",0], weight: 0.30, weight_type: "linear", combine_embeds: "concat", start_at: 0.0, end_at: 0.8, embeds_scaling: "K+V w/ C penalty" } };
    workflow["9"].inputs.model = ["23",0];
  }

  return workflow;
}


// ─── POST-PROCESS TAB: Upscale + Sharpen + Color Grade ───────────────
// RealESRGAN 4× → optional downscale to 2× → SDXL tiled hi-res pass → sharpen.
//
// @param {string} imageFilename
// @param {object} opts
// @param {boolean} [opts.upscale4x=true]        - Run 4× upscale
// @param {boolean} [opts.sharpen=true]           - Apply sharpening
// @param {string}  [opts.colorGrade='none']      - none | warm | cool | vivid | matte
// @param {number}  [opts.targetScale=0.5]        - Final scale relative to 4× (0.5 = 2× output)

export function buildPostProcessWorkflow(imageFilename, opts = {}) {
  const {
    upscale4x = true,
    sharpen = true,
    colorGrade = 'none',
    targetScale = 0.5,
  } = opts;

  // Color grade prompts applied during hi-res pass
  const gradePrompts = {
    none:  'professional architectural interior photography, photorealistic, 8k',
    warm:  'warm color grading, golden tones, cozy atmosphere, professional architectural photography, 8k',
    cool:  'cool color grading, blue-silver tones, crisp modern feel, professional architectural photography, 8k',
    vivid: 'vivid saturated colors, rich tones, vibrant interior, professional architectural photography, 8k',
    matte: 'matte film look, desaturated earth tones, soft contrast, professional architectural photography, 8k',
  };

  const workflow = {
    "1": { class_type: "LoadImage", inputs: { image: imageFilename, upload: "image" } },
  };

  let lastImageOutput = ["1", 0];
  let nextId = 2;

  // ─── 4× Upscale ────────────────────────────────────────────
  if (upscale4x) {
    const upscaleLoadId = String(nextId);
    workflow[upscaleLoadId] = { class_type: "UpscaleModelLoader", inputs: { model_name: "RealESRGAN_x4plus.pth" } };
    nextId++;

    const upscaleId = String(nextId);
    workflow[upscaleId] = { class_type: "ImageUpscaleWithModel", inputs: { upscale_model: [upscaleLoadId,0], image: lastImageOutput } };
    nextId++;

    // Downscale to target (default: 2× = 0.5 of 4×)
    const scaleId = String(nextId);
    workflow[scaleId] = { class_type: "ImageScaleBy", inputs: { image: [upscaleId,0], upscale_method: "lanczos", scale_by: targetScale } };
    lastImageOutput = [scaleId, 0];
    nextId++;

    // SDXL tiled hi-res refinement pass
    const ckptId = String(nextId);
    workflow[ckptId] = { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "sd_xl_base_1.0.safetensors" } };
    nextId++;

    const posId = String(nextId);
    workflow[posId] = { class_type: "CLIPTextEncode", inputs: { text: gradePrompts[colorGrade] || gradePrompts.none, clip: [ckptId,1] } };
    nextId++;

    const negId = String(nextId);
    workflow[negId] = { class_type: "CLIPTextEncode", inputs: { text: "blurry, low quality, noise, artifacts, jpeg compression, pixelated, cartoon, watermark, distorted, oversaturated", clip: [ckptId,1] } };
    nextId++;

    const vaeEncId = String(nextId);
    workflow[vaeEncId] = { class_type: "VAEEncodeTiled", inputs: { pixels: lastImageOutput, vae: [ckptId,2], tile_size: 512, overlap: 64, temporal_size: 64, temporal_overlap: 8 } };
    nextId++;

    const ksampleId = String(nextId);
    workflow[ksampleId] = { class_type: "KSampler", inputs: { seed: seed(), steps: 12, cfg: 4.0, sampler_name: "dpmpp_2m", scheduler: "karras", denoise: 0.20, model: [ckptId,0], positive: [posId,0], negative: [negId,0], latent_image: [vaeEncId,0] } };
    nextId++;

    const vaeDecId = String(nextId);
    workflow[vaeDecId] = { class_type: "VAEDecodeTiled", inputs: { samples: [ksampleId,0], vae: [ckptId,2], tile_size: 512, overlap: 64, temporal_size: 64, temporal_overlap: 8 } };
    lastImageOutput = [vaeDecId, 0];
    nextId++;
  }

  // ─── Sharpen ────────────────────────────────────────────────
  if (sharpen) {
    const sharpenId = String(nextId);
    workflow[sharpenId] = { class_type: "ImageSharpen", inputs: { image: lastImageOutput, sharpen_radius: 2, sigma: 0.65, alpha: 0.55 } };
    lastImageOutput = [sharpenId, 0];
    nextId++;
  }

  // ─── Save ───────────────────────────────────────────────────
  const saveId = String(nextId);
  workflow[saveId] = { class_type: "SaveImage", inputs: { images: lastImageOutput, filename_prefix: "tab_postprocess/result" } };

  return workflow;
}


// ═══════════════════════════════════════════════════════════════════════
// TOOL-SPECIFIC WORKFLOW BUILDERS (Tools 1–15)
// ═══════════════════════════════════════════════════════════════════════

// ─── Tool 1: Auto Edit (Text-Driven Object Change) ──────────────────
export function buildAutoEditWorkflow(imageFilename, opts = {}) {
  const { objectToEdit = 'wall', editDescription = 'white painted wall', denoise = 0.55, detectThreshold = 0.35 } = opts;
  return {
    "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "sd_xl_base_1.0.safetensors" } },
    "2": { class_type: "LoadImage", inputs: { image: imageFilename, upload: "image" } },
    "3": { class_type: "DownloadAndLoadCLIPSeg", inputs: { model: "CIDAS/clipseg-rd64-refined" } },
    "4": { class_type: "BatchCLIPSeg", inputs: { images: ["2",0], text: objectToEdit, threshold: detectThreshold, binary_mask: true, combine_mask: true, use_cuda: true, blur_sigma: 5.0, opt_model: ["3",0] } },
    "5": { class_type: "GrowMask", inputs: { mask: ["4",0], expand: 10, tapered_corners: true } },
    "6": { class_type: "CLIPTextEncode", inputs: { text: `(${editDescription}:1.3), photorealistic interior, professional photography, 8k detail`, clip: ["1",1] } },
    "7": { class_type: "CLIPTextEncode", inputs: { text: "blurry, low quality, artifacts, distorted, cartoon, watermark, mismatched style", clip: ["1",1] } },
    "8": { class_type: "VAEEncodeForInpaint", inputs: { pixels: ["2",0], vae: ["1",2], mask: ["5",0], grow_mask_by: 8 } },
    "9": { class_type: "KSampler", inputs: { seed: seed(), steps: 22, cfg: 6.5, sampler_name: "dpmpp_2m", scheduler: "karras", denoise, model: ["1",0], positive: ["6",0], negative: ["7",0], latent_image: ["8",0] } },
    "10": { class_type: "VAEDecode", inputs: { samples: ["9",0], vae: ["1",2] } },
    "11": { class_type: "SaveImage", inputs: { images: ["10",0], filename_prefix: "tool_auto_edit/result" } },
  };
}

// ─── Tool 8: Empty the Room (Furniture Removal) ─────────────────────
export function buildEmptyRoomWorkflow(imageFilename, opts = {}) {
  const { objectsToRemove = 'furniture, sofa, table, chair, lamp, shelf, rug, plant, decor, bed, cabinet', useLama = true } = opts;
  const workflow = {
    "1": { class_type: "LoadImage", inputs: { image: imageFilename, upload: "image" } },
    "2": { class_type: "DownloadAndLoadCLIPSeg", inputs: { model: "CIDAS/clipseg-rd64-refined" } },
    "3": { class_type: "BatchCLIPSeg", inputs: { images: ["1",0], text: objectsToRemove, threshold: 0.30, binary_mask: true, combine_mask: true, use_cuda: true, blur_sigma: 7.0, opt_model: ["2",0] } },
    "4": { class_type: "GrowMask", inputs: { mask: ["3",0], expand: 12, tapered_corners: true } },
  };
  if (useLama) {
    workflow["5"] = { class_type: "LamaRemover", inputs: { images: ["1",0], masks: ["4",0], mask_threshold: 250, gaussblur_radius: 8, invert_mask: false } };
    workflow["6"] = { class_type: "SaveImage", inputs: { images: ["5",0], filename_prefix: "tool_empty_room/result" } };
  } else {
    workflow["5"] = { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "sd_xl_base_1.0.safetensors" } };
    workflow["6"] = { class_type: "CLIPTextEncode", inputs: { text: "empty room, clean floor, bare walls, no furniture, professional photography", clip: ["5",1] } };
    workflow["7"] = { class_type: "CLIPTextEncode", inputs: { text: "furniture, objects, clutter, blurry, distorted", clip: ["5",1] } };
    workflow["8"] = { class_type: "VAEEncodeForInpaint", inputs: { pixels: ["1",0], vae: ["5",2], mask: ["4",0], grow_mask_by: 10 } };
    workflow["9"] = { class_type: "KSampler", inputs: { seed: seed(), steps: 20, cfg: 5.0, sampler_name: "dpmpp_2m", scheduler: "karras", denoise: 0.75, model: ["5",0], positive: ["6",0], negative: ["7",0], latent_image: ["8",0] } };
    workflow["10"] = { class_type: "VAEDecode", inputs: { samples: ["9",0], vae: ["5",2] } };
    workflow["11"] = { class_type: "SaveImage", inputs: { images: ["10",0], filename_prefix: "tool_empty_room/result" } };
  }
  return workflow;
}

// ─── Tool 6: Point & Edit (Pre-made Mask Inpaint) ───────────────────
export function buildPointEditWorkflow(imageFilename, maskFilename, opts = {}) {
  const { prompt = 'high quality interior detail, photorealistic', denoise = 0.60 } = opts;
  return {
    "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "sd_xl_base_1.0.safetensors" } },
    "2": { class_type: "LoadImage", inputs: { image: imageFilename, upload: "image" } },
    "3": { class_type: "LoadImage", inputs: { image: maskFilename, upload: "image" } },
    "4": { class_type: "ImageToMask", inputs: { image: ["3",0], channel: "red" } },
    "5": { class_type: "GrowMask", inputs: { mask: ["4",0], expand: 6, tapered_corners: true } },
    "6": { class_type: "CLIPTextEncode", inputs: { text: `(${prompt}:1.2), photorealistic, professional interior photography, 8k`, clip: ["1",1] } },
    "7": { class_type: "CLIPTextEncode", inputs: { text: "blurry, low quality, artifacts, distorted, floating objects, cartoon", clip: ["1",1] } },
    "8": { class_type: "VAEEncodeForInpaint", inputs: { pixels: ["2",0], vae: ["1",2], mask: ["5",0], grow_mask_by: 6 } },
    "9": { class_type: "KSampler", inputs: { seed: seed(), steps: 22, cfg: 6.5, sampler_name: "dpmpp_2m", scheduler: "karras", denoise, model: ["1",0], positive: ["6",0], negative: ["7",0], latent_image: ["8",0] } },
    "10": { class_type: "VAEDecode", inputs: { samples: ["9",0], vae: ["1",2] } },
    "11": { class_type: "SaveImage", inputs: { images: ["10",0], filename_prefix: "tool_point_edit/result" } },
  };
}

// ─── Tool 3: Interior AI Render (Dual ControlNet) ───────────────────
export function buildInteriorRenderWorkflow(imageFilename, opts = {}) {
  const { roomType = 'living room', style = 'modern minimalist', prompt = '', referenceImage = null, strength = 0.85, depthStrength = 0.75, cannyStrength = 0.60 } = opts;
  const pos = [`(photorealistic interior of a ${roomType}:1.3)`, `${style} design`, prompt, 'professional architectural photography, 8k, award-winning'].filter(Boolean).join(', ');
  const neg = 'blurry, low quality, distorted, cartoon, watermark, deformed perspective, sketch lines visible';
  const wf = {
    "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "sd_xl_base_1.0.safetensors" } },
    "2": { class_type: "LoadImage", inputs: { image: imageFilename, upload: "image" } },
    "3": { class_type: "DepthAnythingV2Preprocessor", inputs: { image: ["2",0], ckpt_name: "depth_anything_v2_vits.pth", resolution: 1024 } },
    "4": { class_type: "CannyEdgePreprocessor", inputs: { image: ["2",0], low_threshold: 80, high_threshold: 180, resolution: 1024 } },
    "5": { class_type: "ControlNetLoader", inputs: { control_net_name: "controlnet-canny-sdxl.safetensors" } },
    "6": { class_type: "CLIPTextEncode", inputs: { text: pos, clip: ["1",1] } },
    "7": { class_type: "CLIPTextEncode", inputs: { text: neg, clip: ["1",1] } },
    "8": { class_type: "ControlNetApplyAdvanced", inputs: { positive: ["6",0], negative: ["7",0], control_net: ["5",0], image: ["3",0], strength: depthStrength, start_percent: 0.0, end_percent: 0.8 } },
    "9": { class_type: "ControlNetApplyAdvanced", inputs: { positive: ["8",0], negative: ["8",1], control_net: ["5",0], image: ["4",0], strength: cannyStrength, start_percent: 0.0, end_percent: 1.0 } },
    "10": { class_type: "VAEEncode", inputs: { pixels: ["2",0], vae: ["1",2] } },
    "11": { class_type: "KSampler", inputs: { seed: seed(), steps: 28, cfg: 7.0, sampler_name: "dpmpp_2m", scheduler: "karras", denoise: strength, model: ["1",0], positive: ["9",0], negative: ["9",1], latent_image: ["10",0] } },
    "12": { class_type: "VAEDecode", inputs: { samples: ["11",0], vae: ["1",2] } },
    "13": { class_type: "SaveImage", inputs: { images: ["12",0], filename_prefix: "tool_interior_render/result" } },
  };
  if (referenceImage) {
    wf["20"] = { class_type: "LoadImage", inputs: { image: referenceImage, upload: "image" } };
    wf["21"] = { class_type: "IPAdapterUnifiedLoader", inputs: { model: ["1",0], preset: "PLUS (high strength)" } };
    wf["22"] = { class_type: "PrepImageForClipVision", inputs: { image: ["20",0], interpolation: "LANCZOS", crop_position: "center", sharpening: 0.0 } };
    wf["23"] = { class_type: "IPAdapterAdvanced", inputs: { model: ["21",0], ipadapter: ["21",1], image: ["22",0], weight: 0.50, weight_type: "linear", combine_embeds: "concat", start_at: 0.0, end_at: 1.0, embeds_scaling: "K+V w/ C penalty" } };
    wf["11"].inputs.model = ["23",0];
  }
  return wf;
}

// ─── Tool 4: Exterior AI Render ─────────────────────────────────────
export function buildExteriorRenderWorkflow(imageFilename, opts = {}) {
  const { buildingType = 'residential house', style = 'modern', prompt = '', timeOfDay = 'day', strength = 0.80, lineartStrength = 0.70 } = opts;
  const timePrompts = { morning: 'soft morning light', day: 'bright daylight, blue sky', golden_hour: 'golden hour warm sunlight', evening: 'dusk lighting', night: 'night, city lights, dramatic lighting' };
  const pos = [`(photorealistic exterior of a ${buildingType}:1.3)`, `${style} architecture`, timePrompts[timeOfDay] || timePrompts.day, prompt, 'landscaping, professional architectural photography, 8k'].filter(Boolean).join(', ');
  return {
    "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "sd_xl_base_1.0.safetensors" } },
    "2": { class_type: "LoadImage", inputs: { image: imageFilename, upload: "image" } },
    "3": { class_type: "LineArtPreprocessor", inputs: { image: ["2",0], resolution: 1024, coarse: "disable" } },
    "4": { class_type: "ControlNetLoader", inputs: { control_net_name: "controlnet-canny-sdxl.safetensors" } },
    "5": { class_type: "CLIPTextEncode", inputs: { text: pos, clip: ["1",1] } },
    "6": { class_type: "CLIPTextEncode", inputs: { text: "blurry, low quality, distorted, cartoon, interior view, watermark, deformed", clip: ["1",1] } },
    "7": { class_type: "ControlNetApplyAdvanced", inputs: { positive: ["5",0], negative: ["6",0], control_net: ["4",0], image: ["3",0], strength: lineartStrength, start_percent: 0.0, end_percent: 1.0 } },
    "8": { class_type: "VAEEncode", inputs: { pixels: ["2",0], vae: ["1",2] } },
    "9": { class_type: "KSampler", inputs: { seed: seed(), steps: 25, cfg: 7.0, sampler_name: "dpmpp_2m", scheduler: "karras", denoise: strength, model: ["1",0], positive: ["7",0], negative: ["7",1], latent_image: ["8",0] } },
    "10": { class_type: "VAEDecode", inputs: { samples: ["9",0], vae: ["1",2] } },
    "11": { class_type: "SaveImage", inputs: { images: ["10",0], filename_prefix: "tool_exterior_render/result" } },
  };
}

// ─── Tool 5: Creative Landscape ─────────────────────────────────────
export function buildLandscapeWorkflow(imageFilename, opts = {}) {
  const { landscapeType = 'garden', style = 'modern', prompt = '', referenceImage = null, strength = 0.80 } = opts;
  const typePrompts = { garden: 'lush garden, flowering plants, stone pathways', backyard: 'manicured backyard, lawn, patio', pool_area: 'luxury pool area, deck, loungers', rooftop: 'rooftop garden, urban skyline', terrace: 'terrace garden, potted plants, seating' };
  const pos = [`(beautiful ${landscapeType}:1.3)`, typePrompts[landscapeType] || typePrompts.garden, `${style} design`, prompt, 'professional landscape photography, natural lighting, 8k'].filter(Boolean).join(', ');
  const wf = {
    "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "sd_xl_base_1.0.safetensors" } },
    "2": { class_type: "LoadImage", inputs: { image: imageFilename, upload: "image" } },
    "3": { class_type: "DepthAnythingV2Preprocessor", inputs: { image: ["2",0], ckpt_name: "depth_anything_v2_vits.pth", resolution: 1024 } },
    "4": { class_type: "CannyEdgePreprocessor", inputs: { image: ["2",0], low_threshold: 80, high_threshold: 180, resolution: 1024 } },
    "5": { class_type: "ControlNetLoader", inputs: { control_net_name: "controlnet-canny-sdxl.safetensors" } },
    "6": { class_type: "CLIPTextEncode", inputs: { text: pos, clip: ["1",1] } },
    "7": { class_type: "CLIPTextEncode", inputs: { text: "blurry, low quality, distorted, cartoon, indoor, watermark, ugly", clip: ["1",1] } },
    "8": { class_type: "ControlNetApplyAdvanced", inputs: { positive: ["6",0], negative: ["7",0], control_net: ["5",0], image: ["4",0], strength: 0.75, start_percent: 0.0, end_percent: 1.0 } },
    "9": { class_type: "VAEEncode", inputs: { pixels: ["2",0], vae: ["1",2] } },
    "10": { class_type: "KSampler", inputs: { seed: seed(), steps: 25, cfg: 7.0, sampler_name: "dpmpp_2m", scheduler: "karras", denoise: strength, model: ["1",0], positive: ["8",0], negative: ["8",1], latent_image: ["9",0] } },
    "11": { class_type: "VAEDecode", inputs: { samples: ["10",0], vae: ["1",2] } },
    "12": { class_type: "SaveImage", inputs: { images: ["11",0], filename_prefix: "tool_landscape/result" } },
  };
  if (referenceImage) {
    wf["20"] = { class_type: "LoadImage", inputs: { image: referenceImage, upload: "image" } };
    wf["21"] = { class_type: "IPAdapterUnifiedLoader", inputs: { model: ["1",0], preset: "PLUS (high strength)" } };
    wf["22"] = { class_type: "PrepImageForClipVision", inputs: { image: ["20",0], interpolation: "LANCZOS", crop_position: "center", sharpening: 0.0 } };
    wf["23"] = { class_type: "IPAdapterAdvanced", inputs: { model: ["21",0], ipadapter: ["21",1], image: ["22",0], weight: 0.45, weight_type: "linear", combine_embeds: "concat", start_at: 0.0, end_at: 1.0, embeds_scaling: "K+V w/ C penalty" } };
    wf["10"].inputs.model = ["23",0];
  }
  return wf;
}

// ─── Tool 12: Style Transfer (High-Weight IPAdapter) ────────────────
export function buildStyleTransferWorkflow(imageFilename, referenceImage, opts = {}) {
  const { styleWeight = 0.75, structureStrength = 0.90, denoise = 0.45, prompt = '' } = opts;
  const pos = ['(photorealistic interior:1.3)', prompt, 'professional photography, 8k detail, award-winning design'].filter(Boolean).join(', ');
  return {
    "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "sd_xl_base_1.0.safetensors" } },
    "2": { class_type: "LoadImage", inputs: { image: imageFilename, upload: "image" } },
    "3": { class_type: "LoadImage", inputs: { image: referenceImage, upload: "image" } },
    "4": { class_type: "CannyEdgePreprocessor", inputs: { image: ["2",0], low_threshold: 100, high_threshold: 200, resolution: 1024 } },
    "5": { class_type: "ControlNetLoader", inputs: { control_net_name: "controlnet-canny-sdxl.safetensors" } },
    "6": { class_type: "IPAdapterUnifiedLoader", inputs: { model: ["1",0], preset: "PLUS (high strength)" } },
    "7": { class_type: "PrepImageForClipVision", inputs: { image: ["3",0], interpolation: "LANCZOS", crop_position: "center", sharpening: 0.0 } },
    "8": { class_type: "IPAdapterAdvanced", inputs: { model: ["6",0], ipadapter: ["6",1], image: ["7",0], weight: styleWeight, weight_type: "linear", combine_embeds: "concat", start_at: 0.0, end_at: 1.0, embeds_scaling: "K+V w/ C penalty" } },
    "9": { class_type: "CLIPTextEncode", inputs: { text: pos, clip: ["1",1] } },
    "10": { class_type: "CLIPTextEncode", inputs: { text: "blurry, low quality, distorted, cartoon, watermark", clip: ["1",1] } },
    "11": { class_type: "ControlNetApplyAdvanced", inputs: { positive: ["9",0], negative: ["10",0], control_net: ["5",0], image: ["4",0], strength: structureStrength, start_percent: 0.0, end_percent: 1.0 } },
    "12": { class_type: "VAEEncode", inputs: { pixels: ["2",0], vae: ["1",2] } },
    "13": { class_type: "KSampler", inputs: { seed: seed(), steps: 22, cfg: 5.5, sampler_name: "dpmpp_2m", scheduler: "karras", denoise, model: ["8",0], positive: ["11",0], negative: ["11",1], latent_image: ["12",0] } },
    "14": { class_type: "VAEDecode", inputs: { samples: ["13",0], vae: ["1",2] } },
    "15": { class_type: "SaveImage", inputs: { images: ["14",0], filename_prefix: "tool_style_transfer/result" } },
  };
}

// ─── Tool 9: Collage / Moodboard (Multi-Ref IPAdapter) ──────────────
export function buildCollageWorkflow(imageFilename, referenceImages = [], opts = {}) {
  const { weights = [0.5, 0.3, 0.2, 0.1], prompt = '', strength = 0.65 } = opts;
  const pos = ['(photorealistic interior design:1.3)', prompt, 'cohesive style, professional photography, 8k'].filter(Boolean).join(', ');
  const wf = {
    "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "sd_xl_base_1.0.safetensors" } },
    "2": { class_type: "LoadImage", inputs: { image: imageFilename, upload: "image" } },
    "3": { class_type: "CannyEdgePreprocessor", inputs: { image: ["2",0], low_threshold: 100, high_threshold: 200, resolution: 1024 } },
    "4": { class_type: "ControlNetLoader", inputs: { control_net_name: "controlnet-canny-sdxl.safetensors" } },
    "5": { class_type: "CLIPTextEncode", inputs: { text: pos, clip: ["1",1] } },
    "6": { class_type: "CLIPTextEncode", inputs: { text: "blurry, low quality, distorted, cartoon, watermark, collage borders", clip: ["1",1] } },
    "7": { class_type: "ControlNetApplyAdvanced", inputs: { positive: ["5",0], negative: ["6",0], control_net: ["4",0], image: ["3",0], strength: 0.80, start_percent: 0.0, end_percent: 1.0 } },
  };
  // Load first reference + IPAdapter (use first ref as primary)
  let modelOut = ["1", 0];
  if (referenceImages.length > 0) {
    wf["20"] = { class_type: "LoadImage", inputs: { image: referenceImages[0], upload: "image" } };
    wf["21"] = { class_type: "IPAdapterUnifiedLoader", inputs: { model: ["1",0], preset: "PLUS (high strength)" } };
    wf["22"] = { class_type: "PrepImageForClipVision", inputs: { image: ["20",0], interpolation: "LANCZOS", crop_position: "center", sharpening: 0.0 } };
    wf["23"] = { class_type: "IPAdapterAdvanced", inputs: { model: ["21",0], ipadapter: ["21",1], image: ["22",0], weight: weights[0] || 0.5, weight_type: "linear", combine_embeds: "concat", start_at: 0.0, end_at: 1.0, embeds_scaling: "K+V w/ C penalty" } };
    modelOut = ["23", 0];
  }
  wf["30"] = { class_type: "VAEEncode", inputs: { pixels: ["2",0], vae: ["1",2] } };
  wf["31"] = { class_type: "KSampler", inputs: { seed: seed(), steps: 25, cfg: 6.0, sampler_name: "dpmpp_2m", scheduler: "karras", denoise: strength, model: modelOut, positive: ["7",0], negative: ["7",1], latent_image: ["30",0] } };
  wf["32"] = { class_type: "VAEDecode", inputs: { samples: ["31",0], vae: ["1",2] } };
  wf["33"] = { class_type: "SaveImage", inputs: { images: ["32",0], filename_prefix: "tool_collage/result" } };
  return wf;
}

// ─── Tool 13: Background Generator ──────────────────────────────────
export function buildBackgroundWorkflow(imageFilename, opts = {}) {
  const { backgroundType = 'city', prompt = '', denoise = 0.80 } = opts;
  const bgPrompts = { city: 'city skyline panoramic view, skyscrapers', garden: 'lush garden view, green trees, flowers', ocean: 'ocean beach view, turquoise water, waves', mountains: 'mountain landscape, snow peaks, forests', night_city: 'night city view, city lights, dramatic sky', sunset: 'sunset view, golden sky, clouds' };
  const bgDesc = bgPrompts[backgroundType] || bgPrompts.city;
  return {
    "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "sd_xl_base_1.0.safetensors" } },
    "2": { class_type: "LoadImage", inputs: { image: imageFilename, upload: "image" } },
    "3": { class_type: "DownloadAndLoadCLIPSeg", inputs: { model: "CIDAS/clipseg-rd64-refined" } },
    "4": { class_type: "BatchCLIPSeg", inputs: { images: ["2",0], text: "window, background, outdoor view, sky, outside", threshold: 0.30, binary_mask: true, combine_mask: true, use_cuda: true, blur_sigma: 5.0, opt_model: ["3",0] } },
    "5": { class_type: "GrowMask", inputs: { mask: ["4",0], expand: 8, tapered_corners: true } },
    "6": { class_type: "CLIPTextEncode", inputs: { text: `(${bgDesc}:1.3), ${prompt}, photorealistic, stunning view, 8k detail`, clip: ["1",1] } },
    "7": { class_type: "CLIPTextEncode", inputs: { text: "blurry, low quality, indoor furniture, distorted, cartoon, watermark", clip: ["1",1] } },
    "8": { class_type: "VAEEncodeForInpaint", inputs: { pixels: ["2",0], vae: ["1",2], mask: ["5",0], grow_mask_by: 8 } },
    "9": { class_type: "KSampler", inputs: { seed: seed(), steps: 25, cfg: 7.0, sampler_name: "dpmpp_2m", scheduler: "karras", denoise, model: ["1",0], positive: ["6",0], negative: ["7",0], latent_image: ["8",0] } },
    "10": { class_type: "VAEDecode", inputs: { samples: ["9",0], vae: ["1",2] } },
    "11": { class_type: "SaveImage", inputs: { images: ["10",0], filename_prefix: "tool_background/result" } },
  };
}

// ─── Tool 14: View Extender (Outpainting) ───────────────────────────
export function buildViewExtenderWorkflow(imageFilename, opts = {}) {
  const { direction = 'right', extendPercent = 30, prompt = 'continuation of interior room, same style' } = opts;
  // Outpainting: pad image → inpaint the extended area
  const padMap = { left: { left: extendPercent, right: 0, top: 0, bottom: 0 }, right: { left: 0, right: extendPercent, top: 0, bottom: 0 }, up: { left: 0, right: 0, top: extendPercent, bottom: 0 }, down: { left: 0, right: 0, top: 0, bottom: extendPercent }, all: { left: extendPercent, right: extendPercent, top: extendPercent, bottom: extendPercent } };
  const pad = padMap[direction] || padMap.right;
  return {
    "1": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "sd_xl_base_1.0.safetensors" } },
    "2": { class_type: "LoadImage", inputs: { image: imageFilename, upload: "image" } },
    "3": { class_type: "ImagePadForOutpaint", inputs: { image: ["2",0], left: pad.left, top: pad.top, right: pad.right, bottom: pad.bottom, feathering: 40 } },
    "4": { class_type: "CLIPTextEncode", inputs: { text: `(${prompt}:1.2), photorealistic interior, seamless continuation, professional photography, 8k`, clip: ["1",1] } },
    "5": { class_type: "CLIPTextEncode", inputs: { text: "seam, border, different style, blurry, low quality, distorted", clip: ["1",1] } },
    "6": { class_type: "VAEEncodeForInpaint", inputs: { pixels: ["3",0], vae: ["1",2], mask: ["3",1], grow_mask_by: 8 } },
    "7": { class_type: "KSampler", inputs: { seed: seed(), steps: 25, cfg: 6.0, sampler_name: "dpmpp_2m", scheduler: "karras", denoise: 0.85, model: ["1",0], positive: ["4",0], negative: ["5",0], latent_image: ["6",0] } },
    "8": { class_type: "VAEDecode", inputs: { samples: ["7",0], vae: ["1",2] } },
    "9": { class_type: "SaveImage", inputs: { images: ["8",0], filename_prefix: "tool_view_extend/result" } },
  };
}

// ─── Tool 15: Image to Lineart (Preprocessor Only) ──────────────────
export function buildLineartWorkflow(imageFilename, opts = {}) {
  const { lineartType = 'standard', resolution = 1024 } = opts;
  const preprocessors = {
    standard: "LineartStandardPreprocessor",
    realistic: "LineArtPreprocessor",
    anime: "AnimeLineArtPreprocessor",
    canny: "CannyEdgePreprocessor",
    scribble: "ScribblePreprocessor",
  };
  const nodeType = preprocessors[lineartType] || preprocessors.standard;
  const inputs = { image: ["1",0], resolution };
  if (lineartType === 'realistic') inputs.coarse = "disable";
  if (lineartType === 'canny') { inputs.low_threshold = 50; inputs.high_threshold = 150; }
  return {
    "1": { class_type: "LoadImage", inputs: { image: imageFilename, upload: "image" } },
    "2": { class_type: nodeType, inputs },
    "3": { class_type: "SaveImage", inputs: { images: ["2",0], filename_prefix: "tool_lineart/result" } },
  };
}
