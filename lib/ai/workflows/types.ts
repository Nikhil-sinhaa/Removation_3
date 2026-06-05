// lib/ai/workflows/types.ts
// Shared types for the 6-stage Ultra-Pro Interior Design Pipeline

export interface PipelineConfig {
  comfyUrl: string;
  inputDir: string;
  outputDir: string;
  userId: string;
}

// ── Stage I/O Contracts ──────────────────────────────────────────────

export interface Stage1Input {
  imagePath: string;            // ComfyUI input-relative filename
  roomType: string;
  userMaskPath?: string;        // Optional user-painted mask from editor-store
  resolution?: number;          // default 1024
}

export interface Stage1Output {
  cannyEdgeMap: string;         // filename in ComfyUI output
  depthMap: string;
  furnitureMask: string;
  segmentData: SegmentInfo[];
}

export interface SegmentInfo {
  label: string;
  maskFilename: string;
  bbox: { x: number; y: number; w: number; h: number };
  confidence: number;
}

export interface Stage2Input {
  imagePath: string;
  cannyEdgeMap: string;
  depthMap?: string;
  masterSelector: MasterSelectorOptions;
  masterToggles: MasterToggles;
  styleReferenceImage?: string; // Optional mood-board ref image
  userMaskPath?: string;
  wallMask?: string;
  floorMask?: string;
  objectMask?: string;
}

export interface Stage2Output {
  baseRedesignedImage: string;
}

export interface Stage3Input {
  baseRedesignedImage: string;
  furnitureMask: string;
  furnitureReferenceImage: string;
  furnitureStyleText: string;
  userMaskPath?: string;
}

export interface Stage3Output {
  roomWithFurniture: string;
}

export interface Stage4Input {
  roomWithFurniture: string;
  lightingPreset: LightingPreset;
}

export interface Stage4Output {
  litRoomImage: string;
}

export interface Stage5Input {
  litRoomImage: string;
  targetScale: 2 | 4;          // 2× or 4× upscale
}

export interface Stage5Output {
  upscaledImage: string;
}

export interface Stage6Input {
  upscaledImage: string;
  originalImage: string;
  maskStack: string[];          // all masks from stages 1-3
}

export interface Stage6Output {
  finalImagePng: string;
  finalImageWebp: string;
  beforeAfterPair: { before: string; after: string };
}

// ── Master Selector (matches existing MasterSelectorOptions) ────────

export interface MasterSelectorOptions {
  wallColor: string;
  ceiling: string;
  furnitureStyle: string;
  floorType?: string;
  lighting?: string;
  decorStyle?: string;
}

export interface MasterToggles {
  walls: boolean;
  ceiling: boolean;
  furniture: boolean;
  floor: boolean;
  lighting: boolean;
  decor: boolean;
}

// ── Lighting Presets ─────────────────────────────────────────────────

export type LightingPreset =
  | 'warm_evening'
  | 'natural_daylight'
  | 'cool_modern'
  | 'golden_hour'
  | 'dramatic_moody'
  | 'bright_studio'
  | 'soft_ambient';

export const LIGHTING_PROMPTS: Record<LightingPreset, { positive: string; negative: string }> = {
  warm_evening: {
    positive: 'warm evening golden light, soft tungsten glow, cozy atmosphere, warm tones, gentle shadows',
    negative: 'cool tones, blue light, harsh shadows, overexposed',
  },
  natural_daylight: {
    positive: 'natural daylight, soft window light, bright airy interior, neutral white balance',
    negative: 'artificial light, orange cast, dark, underexposed',
  },
  cool_modern: {
    positive: 'cool white LED lighting, modern sleek atmosphere, clean crisp illumination',
    negative: 'warm tones, yellow cast, dim, vintage',
  },
  golden_hour: {
    positive: 'golden hour sunlight streaming through windows, warm amber glow, long soft shadows',
    negative: 'artificial light, cool tones, flat lighting',
  },
  dramatic_moody: {
    positive: 'dramatic moody lighting, deep shadows, accent spotlights, chiaroscuro interior',
    negative: 'flat lighting, overexposed, bright, even illumination',
  },
  bright_studio: {
    positive: 'professional studio lighting, even bright illumination, no harsh shadows, showcase quality',
    negative: 'dark, underexposed, moody, shadows',
  },
  soft_ambient: {
    positive: 'soft ambient glow, indirect lighting, serene calm atmosphere, gentle diffused light',
    negative: 'harsh direct light, strong shadows, overexposed highlights',
  },
};

// ── Furniture Item (for Amazon/Flipkart scraping) ────────────────────

export interface FurnitureItem {
  id: string;
  sourceUrl: string;
  platform: 'amazon' | 'flipkart' | 'manual';
  title: string;
  imageUrl: string;
  processedImagePath: string;
  price?: number;
  currency?: 'INR' | 'USD';
  dimensions?: { w: number; h: number; d: number };
  category: 'sofa' | 'table' | 'chair' | 'bed' | 'shelf' | 'lamp' | 'other';
  placementMask?: string;
}

// ── VRAM Config ──────────────────────────────────────────────────────

export const VRAM_CONFIG = {
  /** ComfyUI base URL */
  comfyUrl: process.env.COMFY_URL || 'http://127.0.0.1:8188',

  /** Delay after POST /free before submitting next stage */
  flushDelayMs: 500,

  /** POST /free payload to fully unload all models */
  freePayload: { unload_models: true, free_memory: true },

  /** Max time to wait for a single stage (ms) */
  stageTimeoutMs: 360_000, // 6 minutes

  /** Poll interval for checking ComfyUI history */
  pollIntervalMs: 2_000,
} as const;
