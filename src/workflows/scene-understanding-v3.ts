/**
 * Scene Understanding V3 — Production-Ready Hybrid Pipeline
 * CLIPSeg (structural surfaces) + GroundingDINO+SAM2 (objects) + DepthAnythingV2
 * 
 * All class_type names verified against installed ComfyUI custom nodes:
 *   - ComfyUI-SAM2/node.py → GroundingDinoSAM2Segment (segment anything2)
 *   - ComfyUI-KJNodes → BatchCLIPSeg, DownloadAndLoadCLIPSeg, GrowMaskWithBlur
 *   - comfyui_controlnet_aux → DepthAnythingV2Preprocessor
 *   - ComfyUI core → MaskComposite, ThresholdMask, MaskToImage, SaveImage, LoadImage
 *
 * Optimized for RTX 4060 8GB — peak ~1.2GB VRAM
 * Outputs: wall_mask, floor_mask, ceiling_mask, object_mask, empty_mask, depth_map
 */

// ─── Types ──────────────────────────────────────────────────────────────────────

export type RoomType = 'living' | 'bedroom' | 'kitchen' | 'dining' | 'bathroom' | 'pooja' | 'balcony' | 'cluttered' | 'modern' | 'general';

export interface SceneUnderstandingV3Config {
  imageFilename: string;       // filename already in ComfyUI/input/
  roomType?: RoomType;
  quality?: 'fast' | 'balanced' | 'best';
  enableDepth?: boolean;
  enableCeiling?: boolean;
  /** SAM2 model — auto-selected based on quality */
  sam2Model?: string;
}

interface PromptSet {
  wallA: string;
  wallB: string;
  floorA: string;
  floorB: string;
  ceilingA: string;
  ceilingB: string;
  furniture: string;    // period-separated for GroundingDINO
  secondary: string;    // period-separated for GroundingDINO
  wallTh: number;
  floorTh: number;
  ceilingTh: number;
  furnitureTh: number;
  secondaryTh: number;
}

// ─── Prompt Library ─────────────────────────────────────────────────────────────

const PROMPT_LIBRARY: Record<RoomType, PromptSet> = {
  general: {
    wallA: 'interior vertical wall surface, painted wall, plaster wall, smooth wall',
    wallB: 'room wall, wall panel, wallpaper, wall texture, interior room background',
    floorA: 'floor, hardwood floor, tile floor, carpet, flooring, floor surface',
    floorB: 'ground surface, flat horizontal surface, walking surface, floor area',
    ceilingA: 'ceiling, ceiling surface, room ceiling, overhead surface',
    ceilingB: 'upper room surface, white ceiling, plastered ceiling',
    furniture: 'sofa . table . chair . bed . cabinet . shelf . wardrobe . desk . dresser',
    secondary: 'lamp . fan . curtain . rug . plant . television . mirror . decoration . air conditioner',
    wallTh: 0.40, floorTh: 0.40, ceilingTh: 0.42, furnitureTh: 0.28, secondaryTh: 0.24,
  },
  living: {
    wallA: 'interior vertical wall surface, painted wall, plaster wall, accent wall',
    wallB: 'room wall, wall panel, wallpaper, textured wall, wall with photo frames',
    floorA: 'marble floor, tile floor, stone floor, carpet, vitrified tiles',
    floorB: 'ground surface, flat horizontal surface, polished floor, rangoli area',
    ceilingA: 'ceiling, false ceiling, ceiling with lights, POP ceiling',
    ceilingB: 'upper room surface, decorative ceiling, ceiling molding',
    furniture: 'sofa . couch . sofa set . center table . coffee table . TV unit . entertainment unit . recliner . armchair . display cabinet . bookshelf . side table',
    secondary: 'ceiling fan . lamp . curtain . rug . carpet . plant . television . air conditioner . wall clock . speaker . decorative item . photo frame . idol . vase . cushion',
    wallTh: 0.38, floorTh: 0.38, ceilingTh: 0.40, furnitureTh: 0.28, secondaryTh: 0.23,
  },
  bedroom: {
    wallA: 'bedroom wall, painted wall, wall behind bed, headboard wall',
    wallB: 'room wall, accent wall, wallpaper, textured wall surface',
    floorA: 'bedroom floor, marble floor, tile floor, wooden floor, carpet',
    floorB: 'ground surface, floor area, floor near bed, floor under furniture',
    ceilingA: 'ceiling, bedroom ceiling, false ceiling',
    ceilingB: 'upper room surface, ceiling with fan, ceiling with light',
    furniture: 'bed . bed frame . headboard . nightstand . bedside table . wardrobe . closet . dresser . dressing table . vanity mirror . study desk . chair . chest of drawers',
    secondary: 'ceiling fan . table lamp . bedside lamp . curtain . rug . air conditioner . mirror . wall decor . photo frame . clock . plant . pillow . cushion',
    wallTh: 0.40, floorTh: 0.38, ceilingTh: 0.42, furnitureTh: 0.28, secondaryTh: 0.24,
  },
  kitchen: {
    wallA: 'kitchen wall, wall with tiles, backsplash wall, wall above counter',
    wallB: 'kitchen interior wall, tiled wall surface, wall between cabinets',
    floorA: 'kitchen floor, tile floor, stone floor, anti-skid floor',
    floorB: 'kitchen ground surface, floor near counter, floor area',
    ceilingA: 'kitchen ceiling, ceiling above counter',
    ceilingB: 'upper surface, ceiling with light, kitchen ceiling',
    furniture: 'kitchen cabinet . upper cabinet . lower cabinet . counter . countertop . kitchen island . dining table . dining chair . storage rack . refrigerator . microwave stand',
    secondary: 'chimney . exhaust fan . light fixture . window . gas stove . microwave . mixer . water purifier . dish rack . spice rack . utensil holder . plant',
    wallTh: 0.42, floorTh: 0.40, ceilingTh: 0.44, furnitureTh: 0.28, secondaryTh: 0.22,
  },
  dining: {
    wallA: 'dining room wall, painted wall, wall near dining table',
    wallB: 'room wall, accent wall, wall with artwork, textured wall',
    floorA: 'dining room floor, marble floor, tile floor, carpet under table',
    floorB: 'ground surface, floor area, polished floor',
    ceilingA: 'ceiling, dining room ceiling, chandelier ceiling',
    ceilingB: 'upper surface, decorative ceiling, ceiling with chandelier',
    furniture: 'dining table . dining chair . sideboard . buffet table . display cabinet . crockery cabinet . bar unit . serving trolley',
    secondary: 'chandelier . pendant light . curtain . rug . plant . wall art . mirror . clock . vase . flower arrangement . candle holder',
    wallTh: 0.40, floorTh: 0.38, ceilingTh: 0.42, furnitureTh: 0.28, secondaryTh: 0.24,
  },
  bathroom: {
    wallA: 'bathroom wall, tiled wall, wall with tiles, shower wall',
    wallB: 'bathroom interior wall, ceramic wall, wall surface in bathroom',
    floorA: 'bathroom floor, wet area floor, tile floor, anti-skid tiles',
    floorB: 'bathroom ground, floor area, floor near toilet, shower floor',
    ceilingA: 'bathroom ceiling, ceiling above shower',
    ceilingB: 'upper surface, bathroom ceiling, false ceiling',
    furniture: 'toilet . bathtub . shower enclosure . vanity . sink . wash basin . cabinet . mirror cabinet . towel rack . washing machine',
    secondary: 'mirror . shower head . faucet . towel . light fixture . exhaust fan . geyser . water heater . soap dispenser . plant',
    wallTh: 0.42, floorTh: 0.42, ceilingTh: 0.44, furnitureTh: 0.30, secondaryTh: 0.25,
  },
  pooja: {
    wallA: 'pooja room wall, prayer room wall, wall behind temple, wall with tiles',
    wallB: 'decorated wall, marble wall, wall with mandir, wall surface',
    floorA: 'pooja room floor, marble floor, clean floor, floor near temple',
    floorB: 'ground surface, floor area, floor under mandir',
    ceilingA: 'pooja room ceiling, decorated ceiling',
    ceilingB: 'upper surface, ceiling with light',
    furniture: 'temple . mandir . pooja shelf . wooden temple . marble temple . cabinet . storage unit',
    secondary: 'idol . statue . brass item . diya . lamp . bell . incense holder . flower vase . garland . picture frame . light fixture . decorative item',
    wallTh: 0.38, floorTh: 0.38, ceilingTh: 0.42, furnitureTh: 0.25, secondaryTh: 0.20,
  },
  balcony: {
    wallA: 'balcony wall, exterior wall, railing wall, parapet wall',
    wallB: 'wall surface, boundary wall, wall with railing',
    floorA: 'balcony floor, tile floor, stone floor, outdoor floor',
    floorB: 'balcony ground, floor area, veranda floor',
    ceilingA: 'balcony ceiling, covered balcony ceiling, roof slab',
    ceilingB: 'upper surface, overhead cover, balcony roof',
    furniture: 'chair . table . swing . jhula . railing . planter box . bench . small table',
    secondary: 'plant . potted plant . hanging plant . light . lamp . curtain . wind chime . bird cage',
    wallTh: 0.38, floorTh: 0.40, ceilingTh: 0.40, furnitureTh: 0.28, secondaryTh: 0.22,
  },
  cluttered: {
    wallA: 'wall surface behind furniture, visible wall area, painted wall',
    wallB: 'room wall, background wall, wall between objects, wall gap',
    floorA: 'visible floor, floor between furniture, floor surface, tile floor',
    floorB: 'ground area, walking space, floor gap between objects',
    ceilingA: 'ceiling, room ceiling',
    ceilingB: 'upper surface, ceiling area',
    furniture: 'sofa . table . chair . bed . cabinet . shelf . wardrobe . desk . stool . trunk . box . chest . rack',
    secondary: 'lamp . fan . curtain . rug . plant . television . mirror . decoration . bag . books . toys . basket . container . appliance . idol . clock . air conditioner',
    wallTh: 0.35, floorTh: 0.35, ceilingTh: 0.40, furnitureTh: 0.25, secondaryTh: 0.20,
  },
  modern: {
    wallA: 'clean wall, modern wall, minimalist wall surface, smooth wall',
    wallB: 'apartment wall, flat wall, wall with clean finish, white wall',
    floorA: 'wooden floor, laminate floor, tile floor, polished floor',
    floorB: 'floor surface, modern flooring, clean floor area',
    ceilingA: 'modern ceiling, flat ceiling, recessed lighting ceiling',
    ceilingB: 'ceiling surface, clean ceiling, LED panel ceiling',
    furniture: 'sofa . sectional . coffee table . TV unit . bookshelf . dining table . dining chair . bar stool . console table . study desk',
    secondary: 'pendant light . floor lamp . table lamp . curtain . blind . rug . plant . television . air conditioner . speaker . artwork . mirror',
    wallTh: 0.42, floorTh: 0.42, ceilingTh: 0.44, furnitureTh: 0.30, secondaryTh: 0.26,
  },
};

// ─── Quality Presets ────────────────────────────────────────────────────────────

const QUALITY_PRESETS = {
  fast:     { depthRes: 512,  sam2Model: 'sam2_hiera_small.pt', blurSigma: 1.0 },
  balanced: { depthRes: 1024, sam2Model: 'sam2_hiera_small.pt', blurSigma: 1.5 },
  best:     { depthRes: 1024, sam2Model: 'sam2_hiera_base_plus.pt', blurSigma: 2.0 },
};

// ─── Main Builder ───────────────────────────────────────────────────────────────

/**
 * Build the Scene Understanding V3 workflow.
 * Returns ComfyUI API-format JSON (flat { nodeId: { inputs, class_type } }).
 * Drop-in compatible with comfyBridge.enqueueJob().
 */
export function buildSceneUnderstandingV3(config: SceneUnderstandingV3Config): Record<string, { class_type: string; inputs: Record<string, any> }> {
  const {
    imageFilename,
    roomType = 'general',
    quality = 'balanced',
    enableDepth = true,
    enableCeiling = true,
  } = config;

  const prompts = PROMPT_LIBRARY[roomType] || PROMPT_LIBRARY.general;
  const preset = QUALITY_PRESETS[quality] || QUALITY_PRESETS.balanced;
  const sam2Model = config.sam2Model || preset.sam2Model;

  const workflow: Record<string, { class_type: string; inputs: Record<string, any> }> = {};

  // ── 1. Load Image ─────────────────────────────────────────────────────────────
  workflow['1'] = {
    class_type: 'LoadImage',
    inputs: { image: imageFilename, upload: 'image' },
  };

  // ── 2. CLIPSeg Model (shared) ─────────────────────────────────────────────────
  workflow['2'] = {
    class_type: 'DownloadAndLoadCLIPSeg',
    inputs: { model: 'CIDAS/clipseg-rd64-refined' },
  };

  // ── 3-3b. Wall Detection (dual-prompt OR ensemble) ────────────────────────────
  workflow['3'] = {
    class_type: 'BatchCLIPSeg',
    inputs: {
      images: ['1', 0], opt_model: ['2', 0],
      text: prompts.wallA,
      threshold: prompts.wallTh, binary_mask: false, combine_mask: true,
      use_cuda: true, blur_sigma: preset.blurSigma,
    },
  };
  workflow['3b'] = {
    class_type: 'BatchCLIPSeg',
    inputs: {
      images: ['1', 0], opt_model: ['2', 0],
      text: prompts.wallB,
      threshold: prompts.wallTh, binary_mask: false, combine_mask: true,
      use_cuda: true, blur_sigma: preset.blurSigma,
    },
  };

  // ── 4-4b. Floor Detection ─────────────────────────────────────────────────────
  workflow['4'] = {
    class_type: 'BatchCLIPSeg',
    inputs: {
      images: ['1', 0], opt_model: ['2', 0],
      text: prompts.floorA,
      threshold: prompts.floorTh, binary_mask: false, combine_mask: true,
      use_cuda: true, blur_sigma: preset.blurSigma,
    },
  };
  workflow['4b'] = {
    class_type: 'BatchCLIPSeg',
    inputs: {
      images: ['1', 0], opt_model: ['2', 0],
      text: prompts.floorB,
      threshold: prompts.floorTh, binary_mask: false, combine_mask: true,
      use_cuda: true, blur_sigma: preset.blurSigma,
    },
  };

  // ── 5c-5d. Ceiling Detection (optional) ───────────────────────────────────────
  if (enableCeiling) {
    workflow['5c'] = {
      class_type: 'BatchCLIPSeg',
      inputs: {
        images: ['1', 0], opt_model: ['2', 0],
        text: prompts.ceilingA,
        threshold: prompts.ceilingTh, binary_mask: false, combine_mask: true,
        use_cuda: true, blur_sigma: preset.blurSigma,
      },
    };
    workflow['5d'] = {
      class_type: 'BatchCLIPSeg',
      inputs: {
        images: ['1', 0], opt_model: ['2', 0],
        text: prompts.ceilingB,
        threshold: prompts.ceilingTh, binary_mask: false, combine_mask: true,
        use_cuda: true, blur_sigma: preset.blurSigma,
      },
    };
  }

  // ── 6-7. GroundingDINO + SAM2 Model Loading ───────────────────────────────────
  workflow['6'] = {
    class_type: 'GroundingDinoModelLoader (segment anything2)',
    inputs: { model_name: 'GroundingDINO_SwinT_OGC (694MB)' },
  };
  workflow['7'] = {
    class_type: 'SAM2ModelLoader (segment anything2)',
    inputs: { model_name: sam2Model },
  };

  // ── 8. Pass 1: Furniture Detection ────────────────────────────────────────────
  workflow['8'] = {
    class_type: 'GroundingDinoSAM2Segment (segment anything2)',
    inputs: {
      sam_model: ['7', 0],
      grounding_dino_model: ['6', 0],
      image: ['1', 0],
      prompt: prompts.furniture,
      threshold: prompts.furnitureTh,
      keep_model_loaded: true,
    },
  };

  // ── 9. Pass 2: Secondary/Clutter Detection ────────────────────────────────────
  workflow['9'] = {
    class_type: 'GroundingDinoSAM2Segment (segment anything2)',
    inputs: {
      sam_model: ['7', 0],
      grounding_dino_model: ['6', 0],
      image: ['1', 0],
      prompt: prompts.secondary,
      threshold: prompts.secondaryTh,
      keep_model_loaded: false,  // unload after last pass
    },
  };

  // ── 10-13. OR Combinations ────────────────────────────────────────────────────
  // Wall: OR of prompt A + prompt B
  workflow['10'] = {
    class_type: 'MaskComposite',
    inputs: { destination: ['3', 0], source: ['3b', 0], x: 0, y: 0, operation: 'or' },
  };
  // Floor: OR of prompt A + prompt B
  workflow['11'] = {
    class_type: 'MaskComposite',
    inputs: { destination: ['4', 0], source: ['4b', 0], x: 0, y: 0, operation: 'or' },
  };
  // Ceiling: OR of prompt A + prompt B
  if (enableCeiling) {
    workflow['12'] = {
      class_type: 'MaskComposite',
      inputs: { destination: ['5c', 0], source: ['5d', 0], x: 0, y: 0, operation: 'or' },
    };
  }
  // Objects: OR furniture + secondary masks
  // GroundingDinoSAM2Segment returns (IMAGE, MASK) — slot 1 is MASK
  workflow['13'] = {
    class_type: 'MaskComposite',
    inputs: { destination: ['8', 1], source: ['9', 1], x: 0, y: 0, operation: 'or' },
  };

  // ── 14-16. Threshold Cleanup ──────────────────────────────────────────────────
  workflow['14'] = {
    class_type: 'ThresholdMask',
    inputs: { mask: ['10', 0], value: 0.35 },
  };
  workflow['15'] = {
    class_type: 'ThresholdMask',
    inputs: { mask: ['11', 0], value: 0.35 },
  };
  if (enableCeiling) {
    workflow['16'] = {
      class_type: 'ThresholdMask',
      inputs: { mask: ['12', 0], value: 0.35 },
    };
  }

  // ── 17-20. Subtraction Chain ──────────────────────────────────────────────────
  // Wall - Floor → removes floor bleed from wall mask
  workflow['17'] = {
    class_type: 'MaskComposite',
    inputs: { destination: ['14', 0], source: ['15', 0], x: 0, y: 0, operation: 'subtract' },
  };
  // Wall - Objects → clean wall-only mask
  workflow['18'] = {
    class_type: 'MaskComposite',
    inputs: { destination: ['17', 0], source: ['13', 0], x: 0, y: 0, operation: 'subtract' },
  };
  // Floor - Objects → floor without furniture footprints
  workflow['19'] = {
    class_type: 'MaskComposite',
    inputs: { destination: ['15', 0], source: ['13', 0], x: 0, y: 0, operation: 'subtract' },
  };
  // Ceiling - Objects (fans, lights)
  if (enableCeiling) {
    workflow['20'] = {
      class_type: 'MaskComposite',
      inputs: { destination: ['16', 0], source: ['13', 0], x: 0, y: 0, operation: 'subtract' },
    };
  }

  // ── 21-23. GrowMaskWithBlur Refinement ────────────────────────────────────────
  // Wall: aggressive hole filling + edge smoothing
  workflow['21'] = {
    class_type: 'GrowMaskWithBlur',
    inputs: {
      mask: ['18', 0], expand: 6, incremental_expandrate: 0.0,
      tapered_corners: true, flip_input: false,
      blur_radius: 4.0, lerp_alpha: 1.0, decay_factor: 1.0, fill_holes: true,
    },
  };
  // Floor: moderate smoothing, hole filling for under-furniture gaps
  workflow['22'] = {
    class_type: 'GrowMaskWithBlur',
    inputs: {
      mask: ['19', 0], expand: 3, incremental_expandrate: 0.0,
      tapered_corners: true, flip_input: false,
      blur_radius: 2.0, lerp_alpha: 1.0, decay_factor: 1.0, fill_holes: true,
    },
  };
  // Objects: gentle edge smoothing, NO hole filling (preserve object shapes)
  workflow['23'] = {
    class_type: 'GrowMaskWithBlur',
    inputs: {
      mask: ['13', 0], expand: 3, incremental_expandrate: 0.0,
      tapered_corners: true, flip_input: false,
      blur_radius: 2.0, lerp_alpha: 1.0, decay_factor: 1.0, fill_holes: false,
    },
  };

  // ── 24. Empty Space = Refined Floor - Refined Objects ─────────────────────────
  workflow['24'] = {
    class_type: 'MaskComposite',
    inputs: { destination: ['22', 0], source: ['23', 0], x: 0, y: 0, operation: 'subtract' },
  };

  // ── 25. Depth Map ─────────────────────────────────────────────────────────────
  if (enableDepth) {
    workflow['25'] = {
      class_type: 'DepthAnythingV2Preprocessor',
      inputs: { image: ['1', 0], ckpt_name: 'depth_anything_v2_vits.pth', resolution: preset.depthRes },
    };
  }

  // ── 26-30. MaskToImage Conversions ────────────────────────────────────────────
  workflow['26'] = { class_type: 'MaskToImage', inputs: { mask: ['21', 0] } };  // wall
  workflow['27'] = { class_type: 'MaskToImage', inputs: { mask: ['22', 0] } };  // floor
  if (enableCeiling) {
    workflow['28'] = { class_type: 'MaskToImage', inputs: { mask: ['20', 0] } }; // ceiling
  }
  workflow['29'] = { class_type: 'MaskToImage', inputs: { mask: ['23', 0] } };  // objects
  workflow['30'] = { class_type: 'MaskToImage', inputs: { mask: ['24', 0] } };  // empty space

  // ── 31-36. SaveImage Outputs ──────────────────────────────────────────────────
  workflow['31'] = { class_type: 'SaveImage', inputs: { images: ['26', 0], filename_prefix: 'stage1/wall_mask' } };
  workflow['32'] = { class_type: 'SaveImage', inputs: { images: ['27', 0], filename_prefix: 'stage1/floor_mask' } };
  if (enableCeiling) {
    workflow['33'] = { class_type: 'SaveImage', inputs: { images: ['28', 0], filename_prefix: 'stage1/ceiling_mask' } };
  }
  workflow['34'] = { class_type: 'SaveImage', inputs: { images: ['29', 0], filename_prefix: 'stage1/object_mask' } };
  workflow['35'] = { class_type: 'SaveImage', inputs: { images: ['30', 0], filename_prefix: 'stage1/empty_mask' } };
  if (enableDepth) {
    workflow['36'] = { class_type: 'SaveImage', inputs: { images: ['25', 0], filename_prefix: 'stage1/depth_map' } };
  }

  return workflow;
}

// ─── Convenience: Get prompts for a room type (useful for debugging) ────────────

export function getPromptsForRoom(roomType: RoomType): PromptSet {
  return PROMPT_LIBRARY[roomType] || PROMPT_LIBRARY.general;
}

// ─── Convenience: List all supported room types ─────────────────────────────────

export function getSupportedRoomTypes(): RoomType[] {
  return Object.keys(PROMPT_LIBRARY) as RoomType[];
}

export default buildSceneUnderstandingV3;
