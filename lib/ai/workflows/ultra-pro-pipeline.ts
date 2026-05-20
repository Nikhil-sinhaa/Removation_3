// lib/ai/workflows/ultra-pro-pipeline.ts
// ⚠️  DEPRECATED — REFERENCE ONLY — NOT USED IN PRODUCTION ⚠️
//
// This file uses Impact Pack nodes that are NOT confirmed installed in ComfyUI:
//   - SAMLoader / ImpactSimpleDetectorSEGS / SegsToCombinedMask (Stage 1)
//   - ToBasicPipe / RegionalSampler / CombineRegionalPrompts (Stage 3)
//   - MaskDetailerPipe (Stage 5)
// It also references "4x-UltraSharp.pth" which is NOT installed.
// The installed upscaler is "RealESRGAN_x4plus.pth".
//
// THE ACTIVE PIPELINE IS:
//   src/services/comfyBridge.js → enqueueUltraProJob()
//   src/workflows/ultraProBuilder.js → buildStage1..6()
//
// This file is kept as architectural reference. Do not call it.
//
// 6-Stage Ultra-Pro Interior Design Pipeline — ComfyUI API Format Builders
// Each function returns { prompt: Record<string, { inputs, class_type }> }
// All node class_types verified from Impact Pack / IPAdapter Plus source code

import type {
  MasterSelectorOptions,
  MasterToggles,
  FurnitureItem,
  LightingPreset,
  LIGHTING_PROMPTS as LightingPromptsType,
} from './types';
import { LIGHTING_PROMPTS } from './types';

// ─── Utility ─────────────────────────────────────────────────────────

function seed(): number {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}

type ComfyRef = [string, number]; // [nodeId, slotIndex]
function ref(nodeId: string | number, slot: number = 0): ComfyRef {
  return [String(nodeId), slot];
}

interface ComfyNode {
  inputs: Record<string, any>;
  class_type: string;
}
type Workflow = { prompt: Record<string, ComfyNode> };

// ─── Stage 1: Scene Understanding ────────────────────────────────────
// SAM2 + CLIPSeg segmentation + DepthAnythingV2

export interface UltraProStage1Input {
  imagePath: string;       // ComfyUI input-relative filename
  roomType: string;
}

export function createUltraProStage1(input: UltraProStage1Input): Workflow {
  const { imagePath, roomType } = input;
  return {
    prompt: {
      // Load Image
      "1": {
        inputs: { image: imagePath, upload: "image" },
        class_type: "LoadImage",
      },
      // SAM2 Model Loader
      "2": {
        inputs: { model_name: "sam2_hiera_small.safetensors", segmentor: "single_image" },
        class_type: "SAMLoader",
      },
      // CLIPSeg — wall detection
      "3": {
        inputs: { text: "wall", blur: 7, threshold: 0.4 },
        class_type: "CLIPSegDetectorProvider",
      },
      // CLIPSeg — floor detection
      "4": {
        inputs: { text: "floor", blur: 7, threshold: 0.4 },
        class_type: "CLIPSegDetectorProvider",
      },
      // CLIPSeg — furniture/object detection
      "5": {
        inputs: { text: "furniture, sofa, chair, table, bed, shelf", blur: 7, threshold: 0.35 },
        class_type: "CLIPSegDetectorProvider",
      },
      // CLIPSeg — empty space detection
      "6": {
        inputs: { text: "empty floor, open area, empty space", blur: 7, threshold: 0.3 },
        class_type: "CLIPSegDetectorProvider",
      },
      // Detect wall SEGS
      "7": {
        inputs: {
          bbox_detector: ref("3"), image: ref("1"),
          bbox_threshold: 0.3, bbox_dilation: 10, crop_factor: 1.5,
          drop_size: 20, sub_threshold: 0.3, sub_dilation: 0, sub_bbox_expansion: 0,
          sam_model_opt: ref("2"), segm_detector_opt: ref("3"),
        },
        class_type: "ImpactSimpleDetectorSEGS",
      },
      // Detect floor SEGS
      "8": {
        inputs: {
          bbox_detector: ref("4"), image: ref("1"),
          bbox_threshold: 0.3, bbox_dilation: 10, crop_factor: 1.5,
          drop_size: 20, sub_threshold: 0.3, sub_dilation: 0, sub_bbox_expansion: 0,
          sam_model_opt: ref("2"), segm_detector_opt: ref("4"),
        },
        class_type: "ImpactSimpleDetectorSEGS",
      },
      // Detect object SEGS
      "9": {
        inputs: {
          bbox_detector: ref("5"), image: ref("1"),
          bbox_threshold: 0.25, bbox_dilation: 10, crop_factor: 1.5,
          drop_size: 15, sub_threshold: 0.25, sub_dilation: 0, sub_bbox_expansion: 0,
          sam_model_opt: ref("2"), segm_detector_opt: ref("5"),
        },
        class_type: "ImpactSimpleDetectorSEGS",
      },
      // Detect empty SEGS
      "10": {
        inputs: {
          bbox_detector: ref("6"), image: ref("1"),
          bbox_threshold: 0.2, bbox_dilation: 10, crop_factor: 1.5,
          drop_size: 30, sub_threshold: 0.2, sub_dilation: 0, sub_bbox_expansion: 0,
          sam_model_opt: ref("2"), segm_detector_opt: ref("6"),
        },
        class_type: "ImpactSimpleDetectorSEGS",
      },
      // Convert SEGS → combined masks
      "11": { inputs: { segs: ref("7") }, class_type: "SegsToCombinedMask" },
      "12": { inputs: { segs: ref("8") }, class_type: "SegsToCombinedMask" },
      "13": { inputs: { segs: ref("9") }, class_type: "SegsToCombinedMask" },
      "14": { inputs: { segs: ref("10") }, class_type: "SegsToCombinedMask" },
      // Depth map
      "15": {
        inputs: { image: ref("1"), ckpt_name: "depth_anything_v2_vits.pth", resolution: 1024 },
        class_type: "DepthAnythingV2Preprocessor",
      },
      // Save masks
      "16": { inputs: { images: ref("11"), filename_prefix: "stage1/wall_mask" }, class_type: "SaveImage" },
      "17": { inputs: { images: ref("12"), filename_prefix: "stage1/floor_mask" }, class_type: "SaveImage" },
      "18": { inputs: { images: ref("13"), filename_prefix: "stage1/object_mask" }, class_type: "SaveImage" },
      "19": { inputs: { images: ref("14"), filename_prefix: "stage1/empty_mask" }, class_type: "SaveImage" },
      "20": { inputs: { images: ref("15"), filename_prefix: "stage1/depth_map" }, class_type: "SaveImage" },
    },
  };
}

// ─── Stage 2: Geometry Locking (Triple ControlNet) ───────────────────

export interface UltraProStage2Input {
  imagePath: string;
  depthMap: string;       // from Stage 1
  masterSelector: MasterSelectorOptions;
  masterToggles: MasterToggles;
  roomType: string;
}

export function createUltraProStage2(input: UltraProStage2Input): Workflow {
  const { imagePath, depthMap, masterSelector, masterToggles, roomType } = input;

  // Build prompt from master selector
  const parts: string[] = [`photorealistic interior of a ${roomType}`];
  if (masterToggles.walls) parts.push(`${masterSelector.wallColor} walls`);
  if (masterToggles.ceiling) parts.push(`${masterSelector.ceiling} ceiling`);
  if (masterToggles.furniture) parts.push(`${masterSelector.furnitureStyle} furniture`);
  if (masterToggles.floor && masterSelector.floorType) parts.push(`${masterSelector.floorType} flooring`);
  if (masterToggles.lighting && masterSelector.lighting) parts.push(`${masterSelector.lighting} lighting`);
  if (masterToggles.decor && masterSelector.decorStyle) parts.push(`${masterSelector.decorStyle} style`);
  parts.push('professional architectural photography, 8k, ultra detail');
  const positivePrompt = parts.join(', ');

  return {
    prompt: {
      "1": { inputs: { ckpt_name: "sd_xl_base_1.0.safetensors" }, class_type: "CheckpointLoaderSimple" },
      "2": { inputs: { image: imagePath, upload: "image" }, class_type: "LoadImage" },
      "3": { inputs: { image: depthMap, upload: "image" }, class_type: "LoadImage" },
      // Canny preprocessor
      "4": {
        inputs: { image: ref("2"), low_threshold: 100, high_threshold: 200, resolution: 1024 },
        class_type: "CannyEdgePreprocessor",
      },
      // Lineart preprocessor
      "5": {
        inputs: { image: ref("2"), resolution: 1024 },
        class_type: "LineArtPreprocessor",
      },
      // Load ControlNets (LoRA rank128 variants for VRAM efficiency)
      "6": { inputs: { control_net_name: "control-lora-depth-rank256.safetensors" }, class_type: "ControlNetLoader" },
      "7": { inputs: { control_net_name: "control-lora-canny-rank256.safetensors" }, class_type: "ControlNetLoader" },
      "8": { inputs: { control_net_name: "control-lora-sketch-rank256.safetensors" }, class_type: "ControlNetLoader" },
      // Prompts
      "9": { inputs: { text: positivePrompt, clip: ref("1", 1) }, class_type: "CLIPTextEncode" },
      "10": {
        inputs: {
          text: "blurry, low quality, distorted, cartoon, watermark, text, deformed perspective, unrealistic",
          clip: ref("1", 1),
        },
        class_type: "CLIPTextEncode",
      },
      // Chain ControlNets: Depth (0.90) → Canny (0.65) → Lineart (0.45)
      "11": {
        inputs: {
          positive: ref("9"), negative: ref("10"),
          control_net: ref("6"), image: ref("3"),
          strength: 0.90, start_percent: 0.0, end_percent: 1.0,
        },
        class_type: "ControlNetApplyAdvanced",
      },
      "12": {
        inputs: {
          positive: ref("11", 0), negative: ref("11", 1),
          control_net: ref("7"), image: ref("4"),
          strength: 0.65, start_percent: 0.0, end_percent: 0.85,
        },
        class_type: "ControlNetApplyAdvanced",
      },
      "13": {
        inputs: {
          positive: ref("12", 0), negative: ref("12", 1),
          control_net: ref("8"), image: ref("5"),
          strength: 0.45, start_percent: 0.0, end_percent: 0.7,
        },
        class_type: "ControlNetApplyAdvanced",
      },
      // Encode + Sample
      "14": { inputs: { pixels: ref("2"), vae: ref("1", 2) }, class_type: "VAEEncode" },
      "15": {
        inputs: {
          seed: seed(), steps: 25, cfg: 7.0, sampler_name: "dpmpp_2m", scheduler: "karras",
          denoise: 0.75, model: ref("1"), positive: ref("13", 0), negative: ref("13", 1),
          latent_image: ref("14"),
        },
        class_type: "KSampler",
      },
      "16": { inputs: { samples: ref("15"), vae: ref("1", 2) }, class_type: "VAEDecode" },
      "17": { inputs: { images: ref("16"), filename_prefix: "stage2/redesigned" }, class_type: "SaveImage" },
    },
  };
}

// ─── Stage 3: Regional Inpainting ────────────────────────────────────

export interface UltraProStage3Input {
  redesignedImage: string;  // from Stage 2
  wallMask: string;         // from Stage 1
  objectMask: string;       // from Stage 1
  wallPrompt: string;
  furniturePrompt: string;
}

export function createUltraProStage3(input: UltraProStage3Input): Workflow {
  const { redesignedImage, wallMask, objectMask, wallPrompt, furniturePrompt } = input;
  return {
    prompt: {
      "1": { inputs: { ckpt_name: "sd_xl_base_1.0.safetensors" }, class_type: "CheckpointLoaderSimple" },
      "2": { inputs: { image: redesignedImage, upload: "image" }, class_type: "LoadImage" },
      "3": { inputs: { image: wallMask, upload: "image" }, class_type: "LoadImage" },
      "4": { inputs: { image: objectMask, upload: "image" }, class_type: "LoadImage" },
      // Wall region prompt
      "5": { inputs: { text: wallPrompt, clip: ref("1", 1) }, class_type: "CLIPTextEncode" },
      // Furniture region prompt
      "6": { inputs: { text: furniturePrompt, clip: ref("1", 1) }, class_type: "CLIPTextEncode" },
      // Negative
      "7": {
        inputs: {
          text: "blurry, low quality, artifacts, distorted perspective, floating furniture, mismatched style",
          clip: ref("1", 1),
        },
        class_type: "CLIPTextEncode",
      },
      // Build BASIC_PIPE
      "8": {
        inputs: { model: ref("1"), clip: ref("1", 1), vae: ref("1", 2), positive: ref("5"), negative: ref("7") },
        class_type: "ToBasicPipe",
      },
      // KSampler Advanced Providers (one per region)
      "9": {
        inputs: {
          cfg: 7.0, sampler_name: "dpmpp_2m", scheduler: "karras",
          basic_pipe: ref("8"), use_cfg_scale: false,
        },
        class_type: "KSamplerAdvancedProvider",
      },
      "10": {
        inputs: {
          cfg: 7.0, sampler_name: "dpmpp_2m", scheduler: "karras",
          basic_pipe: ref("8"), use_cfg_scale: false,
        },
        class_type: "KSamplerAdvancedProvider",
      },
      // Edit pipe for furniture region (swap positive prompt)
      "11": {
        inputs: { basic_pipe: ref("8"), positive: ref("6") },
        class_type: "EditBasicPipe",
      },
      "12": {
        inputs: {
          cfg: 7.0, sampler_name: "dpmpp_2m", scheduler: "karras",
          basic_pipe: ref("11"), use_cfg_scale: false,
        },
        class_type: "KSamplerAdvancedProvider",
      },
      // Regional Prompts: wall mask → wall sampler, object mask → furniture sampler
      "13": {
        inputs: { mask: ref("3", 1), advanced_sampler: ref("9") },
        class_type: "RegionalPrompt",
      },
      "14": {
        inputs: { mask: ref("4", 1), advanced_sampler: ref("12") },
        class_type: "RegionalPrompt",
      },
      // Combine regional prompts
      "15": {
        inputs: { regional_prompts1: ref("13"), regional_prompts2: ref("14") },
        class_type: "CombineRegionalPrompts",
      },
      // VAE Encode for Inpainting
      "16": {
        inputs: {
          pixels: ref("2"), vae: ref("1", 2),
          mask: ref("3", 1), grow_mask_by: 6,
        },
        class_type: "VAEEncodeForInpaint",
      },
      // Regional Sampler
      "17": {
        inputs: {
          seed: seed(), steps: 20, denoise: 0.55,
          samples: ref("16"), base_sampler: ref("10"),
          regional_prompts: ref("15"),
          overlap_factor: 0.3, restore_latent: true,
          additional_mode: "ratio additional", additional_sampler: "auto",
          additional_sigma_ratio: 0.3,
        },
        class_type: "RegionalSampler",
      },
      "18": { inputs: { samples: ref("17"), vae: ref("1", 2) }, class_type: "VAEDecode" },
      "19": { inputs: { images: ref("18"), filename_prefix: "stage3/regional_inpainted" }, class_type: "SaveImage" },
    },
  };
}

// ─── Stage 4: IPAdapter Furniture Integration ────────────────────────

export interface UltraProStage4Input {
  stage3Image: string;        // from Stage 3
  styleReference: string;     // moodboard image
  furnitureProduct: string;   // BG-removed product image
  objectMask: string;         // from Stage 1
  depthMap: string;           // from Stage 1
}

export function createUltraProStage4(input: UltraProStage4Input): Workflow {
  const { stage3Image, styleReference, furnitureProduct, objectMask, depthMap } = input;
  return {
    prompt: {
      "1": { inputs: { ckpt_name: "sd_xl_base_1.0.safetensors" }, class_type: "CheckpointLoaderSimple" },
      "2": { inputs: { image: stage3Image, upload: "image" }, class_type: "LoadImage" },
      "3": { inputs: { image: styleReference, upload: "image" }, class_type: "LoadImage" },
      "4": { inputs: { image: furnitureProduct, upload: "image" }, class_type: "LoadImage" },
      "5": { inputs: { image: objectMask, upload: "image" }, class_type: "LoadImage" },
      "6": { inputs: { image: depthMap, upload: "image" }, class_type: "LoadImage" },
      // IPAdapter Unified Loader (PLUS preset for SDXL)
      "7": {
        inputs: { model: ref("1"), preset: "PLUS (high strength)" },
        class_type: "IPAdapterUnifiedLoader",
      },
      // Prep images for CLIP Vision (224×224)
      "8": {
        inputs: { image: ref("3"), interpolation: "LANCZOS", crop_position: "center", sharpening: 0.0 },
        class_type: "PrepImageForClipVision",
      },
      "9": {
        inputs: { image: ref("4"), interpolation: "LANCZOS", crop_position: "pad", sharpening: 0.1 },
        class_type: "PrepImageForClipVision",
      },
      // IPAdapter Pass 1: Style Transfer (global, weight 0.40)
      "10": {
        inputs: {
          model: ref("7"), ipadapter: ref("7", 1), image: ref("8"),
          weight: 0.40, weight_type: "linear", combine_embeds: "concat",
          start_at: 0.0, end_at: 1.0, embeds_scaling: "K+V w/ C penalty",
        },
        class_type: "IPAdapterAdvanced",
      },
      // IPAdapter Pass 2: Furniture Placement (masked, weight 0.80)
      "11": {
        inputs: {
          model: ref("10"), ipadapter: ref("7", 1), image: ref("9"),
          weight: 0.80, weight_type: "linear", combine_embeds: "concat",
          start_at: 0.0, end_at: 0.85, embeds_scaling: "V only",
          attn_mask: ref("5", 1), // Object mask as attention mask
        },
        class_type: "IPAdapterAdvanced",
      },
      // Prompts
      "12": {
        inputs: {
          text: "(professional architectural interior photography:1.3), (elegant modern furniture placement:1.2), cohesive interior design, matching style and materials, realistic proportions, natural light interaction, 8k ultra detail",
          clip: ref("1", 1),
        },
        class_type: "CLIPTextEncode",
      },
      "13": {
        inputs: {
          text: "blurry, low quality, floating furniture, unrealistic proportions, mismatched style, cartoon, painting, watermark, text, distorted perspective, duplicate items",
          clip: ref("1", 1),
        },
        class_type: "CLIPTextEncode",
      },
      // Depth ControlNet for spatial consistency
      "14": { inputs: { control_net_name: "control-lora-depth-rank256.safetensors" }, class_type: "ControlNetLoader" },
      "15": {
        inputs: {
          positive: ref("12"), negative: ref("13"),
          control_net: ref("14"), image: ref("6"),
          strength: 0.70, start_percent: 0.0, end_percent: 1.0,
        },
        class_type: "ControlNetApplyAdvanced",
      },
      // Encode + Sample + Decode
      "16": { inputs: { pixels: ref("2"), vae: ref("1", 2) }, class_type: "VAEEncode" },
      "17": {
        inputs: {
          seed: seed(), steps: 25, cfg: 5.5, sampler_name: "dpmpp_2m", scheduler: "karras",
          denoise: 0.45, model: ref("11"), positive: ref("15", 0), negative: ref("15", 1),
          latent_image: ref("16"),
        },
        class_type: "KSampler",
      },
      "18": { inputs: { samples: ref("17"), vae: ref("1", 2) }, class_type: "VAEDecode" },
      "19": { inputs: { images: ref("18"), filename_prefix: "stage4/furniture_placed" }, class_type: "SaveImage" },
    },
  };
}

// ─── Stage 5+6: Refinement, Upscale & Sharpen ───────────────────────

export interface UltraProStage56Input {
  stage4Image: string;    // from Stage 4
  wallMask: string;       // from Stage 1
  objectMask: string;     // from Stage 1
}

export function createUltraProStage56(input: UltraProStage56Input): Workflow {
  const { stage4Image, wallMask, objectMask } = input;
  return {
    prompt: {
      "1": { inputs: { ckpt_name: "sd_xl_base_1.0.safetensors" }, class_type: "CheckpointLoaderSimple" },
      "2": { inputs: { image: stage4Image, upload: "image" }, class_type: "LoadImage" },
      "3": { inputs: { image: wallMask, upload: "image" }, class_type: "LoadImage" },
      "4": { inputs: { image: objectMask, upload: "image" }, class_type: "LoadImage" },
      // Prompts
      "5": {
        inputs: {
          text: "(professional architectural interior photography:1.3), ultra sharp details, pristine surfaces, perfect lighting, photorealistic, (8k RAW photo:1.2), masterpiece",
          clip: ref("1", 1),
        },
        class_type: "CLIPTextEncode",
      },
      "6": {
        inputs: {
          text: "blurry, low quality, noise, artifacts, jpeg compression, pixelated, cartoon, painting, watermark, text, distorted, deformed, oversaturated",
          clip: ref("1", 1),
        },
        class_type: "CLIPTextEncode",
      },
      // BASIC_PIPE for detailers
      "7": {
        inputs: { model: ref("1"), clip: ref("1", 1), vae: ref("1", 2), positive: ref("5"), negative: ref("6") },
        class_type: "ToBasicPipe",
      },
      // ═══ STAGE 5: Iterative Refinement ═══
      // Pass 1: Global coherence (low denoise)
      "8": { inputs: { pixels: ref("2"), vae: ref("1", 2) }, class_type: "VAEEncode" },
      "9": {
        inputs: {
          seed: seed(), steps: 15, cfg: 4.5, sampler_name: "dpmpp_2m", scheduler: "karras",
          denoise: 0.25, model: ref("1"), positive: ref("5"), negative: ref("6"),
          latent_image: ref("8"),
        },
        class_type: "KSampler",
      },
      "10": { inputs: { samples: ref("9"), vae: ref("1", 2) }, class_type: "VAEDecode" },
      // Pass 2: Wall region detailer
      "11": {
        inputs: {
          image: ref("10"), mask: ref("3", 1), basic_pipe: ref("7"),
          guide_size: 512, guide_size_for: true, max_size: 1024, mask_mode: true,
          seed: seed(), steps: 15, cfg: 5.0, sampler_name: "dpmpp_2m", scheduler: "karras",
          denoise: 0.35, feather: 5, crop_factor: 3.0, drop_size: 10,
          refiner_ratio: 0.2, batch_size: 1, cycle: 1,
        },
        class_type: "MaskDetailerPipe",
      },
      // Pass 3: Furniture region detailer
      "12": {
        inputs: {
          image: ref("11"), mask: ref("4", 1), basic_pipe: ref("7"),
          guide_size: 512, guide_size_for: true, max_size: 1024, mask_mode: true,
          seed: seed(), steps: 15, cfg: 6.0, sampler_name: "dpmpp_2m", scheduler: "karras",
          denoise: 0.40, feather: 5, crop_factor: 3.0, drop_size: 10,
          refiner_ratio: 0.2, batch_size: 1, cycle: 1,
        },
        class_type: "MaskDetailerPipe",
      },
      // Save Stage 5 result (intermediate)
      "13": { inputs: { images: ref("12"), filename_prefix: "stage5/refined" }, class_type: "SaveImage" },
      // ═══ STAGE 6: Upscale + Sharpen ═══
      // Load 4x-UltraSharp model
      "14": { inputs: { model_name: "4x-UltraSharp.pth" }, class_type: "UpscaleModelLoader" },
      // 4× pixel upscale
      "15": { inputs: { upscale_model: ref("14"), image: ref("12") }, class_type: "ImageUpscaleWithModel" },
      // Downscale to 2048×2048 (VRAM-safe target)
      "16": {
        inputs: { image: ref("15"), upscale_method: "lanczos", width: 2048, height: 2048, crop: "disabled" },
        class_type: "ImageScale",
      },
      // Low-denoise refinement at high res
      "17": { inputs: { pixels: ref("16"), vae: ref("1", 2) }, class_type: "VAEEncode" },
      "18": {
        inputs: {
          seed: seed(), steps: 12, cfg: 4.0, sampler_name: "dpmpp_2m", scheduler: "karras",
          denoise: 0.20, model: ref("1"), positive: ref("5"), negative: ref("6"),
          latent_image: ref("17"),
        },
        class_type: "KSampler",
      },
      "19": { inputs: { samples: ref("18"), vae: ref("1", 2) }, class_type: "VAEDecode" },
      // Final sharpen
      "20": {
        inputs: { image: ref("19"), sharpen_radius: 2, sigma: 0.65, alpha: 0.55 },
        class_type: "ImageSharpen",
      },
      // Save final output
      "21": { inputs: { images: ref("20"), filename_prefix: "stage6_final/ultra_hd_result" }, class_type: "SaveImage" },
    },
  };
}

// ─── Master Pipeline Builder ─────────────────────────────────────────

export interface UltraProPipelineRequest {
  imagePath: string;
  roomType: string;
  userId: string;
  masterSelector: MasterSelectorOptions;
  masterToggles: MasterToggles;
  styleReferenceImage?: string;
  furnitureProduct?: string;       // BG-removed product image path
  furnitureObjectMask?: string;    // Custom user-painted mask for furniture placement
  lightingPreset?: LightingPreset;
  skipStages?: number[];
}

/**
 * Build the complete Ultra-Pro pipeline as an array of stage workflows.
 * Each stage is submitted sequentially with VRAM flush between stages.
 *
 * The orchestrator handles: submit → poll → extract output filenames → feed next stage
 */
export function buildUltraProStages(request: UltraProPipelineRequest): {
  stage: number;
  name: string;
  workflow: Workflow;
  outputPrefix: string;
}[] {
  const stages: { stage: number; name: string; workflow: Workflow; outputPrefix: string }[] = [];
  const skip = new Set(request.skipStages || []);

  // Stage 1: Scene Understanding
  if (!skip.has(1)) {
    stages.push({
      stage: 1,
      name: 'Scene Understanding',
      workflow: createUltraProStage1({
        imagePath: request.imagePath,
        roomType: request.roomType,
      }),
      outputPrefix: 'stage1/',
    });
  }

  // Stage 2 uses Stage 1 depth_map output filename (resolved at runtime by orchestrator)
  if (!skip.has(2)) {
    stages.push({
      stage: 2,
      name: 'Geometry Locking',
      workflow: createUltraProStage2({
        imagePath: request.imagePath,
        depthMap: '{{stage1.depth_map}}',   // placeholder — resolved by orchestrator
        masterSelector: request.masterSelector,
        masterToggles: request.masterToggles,
        roomType: request.roomType,
      }),
      outputPrefix: 'stage2/',
    });
  }

  // Stage 3: Regional Inpainting
  if (!skip.has(3)) {
    const wallPrompt = request.masterToggles.walls
      ? `${request.masterSelector.wallColor} walls, smooth surface, professional finish`
      : 'original walls, clean surface';
    const furniturePrompt = request.masterToggles.furniture
      ? `${request.masterSelector.furnitureStyle} furniture, high quality, detailed texture`
      : 'original furniture, clean, organized';

    stages.push({
      stage: 3,
      name: 'Regional Inpainting',
      workflow: createUltraProStage3({
        redesignedImage: '{{stage2.redesigned}}',
        wallMask: '{{stage1.wall_mask}}',
        objectMask: '{{stage1.object_mask}}',
        wallPrompt,
        furniturePrompt,
      }),
      outputPrefix: 'stage3/',
    });
  }

  // Stage 4: IPAdapter Furniture (only if furniture product provided)
  if (!skip.has(4) && request.furnitureProduct) {
    stages.push({
      stage: 4,
      name: 'IPAdapter Furniture',
      workflow: createUltraProStage4({
        stage3Image: '{{stage3.regional_inpainted}}',
        styleReference: request.styleReferenceImage || request.imagePath,
        furnitureProduct: request.furnitureProduct,
        objectMask: request.furnitureObjectMask || '{{stage1.object_mask}}',
        depthMap: '{{stage1.depth_map}}',
      }),
      outputPrefix: 'stage4/',
    });
  }

  // Stage 5+6: Refinement + Upscale
  if (!skip.has(5)) {
    const prevImage = request.furnitureProduct && !skip.has(4)
      ? '{{stage4.furniture_placed}}'
      : '{{stage3.regional_inpainted}}';

    stages.push({
      stage: 56,
      name: 'Refinement + Upscale',
      workflow: createUltraProStage56({
        stage4Image: prevImage,
        wallMask: '{{stage1.wall_mask}}',
        objectMask: '{{stage1.object_mask}}',
      }),
      outputPrefix: 'stage6_final/',
    });
  }

  return stages;
}
