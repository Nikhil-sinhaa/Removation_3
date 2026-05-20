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

// ─── Stage 1: Scene Understanding (V3 Hybrid Pipeline) ─────────────────────────
// Uses GroundingDINO + SAM2 for object-precise masks, and CLIPSeg for structural surfaces.
// Optimized for RTX 4060 8GB — peak ~1.2GB VRAM

const PROMPT_LIBRARY = {
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
  office: {
    wallA: 'office wall, study wall, painted wall, smooth wall',
    wallB: 'room wall, wall with shelves, wall with whiteboard',
    floorA: 'office floor, wooden floor, carpet floor, tile floor',
    floorB: 'ground surface, floor area, walking surface',
    ceilingA: 'office ceiling, ceiling surface',
    ceilingB: 'upper room surface, ceiling with lights',
    furniture: 'desk . office chair . bookshelf . filing cabinet . study table . shelving unit',
    secondary: 'lamp . computer . monitor . laptop . curtain . blind . plant . books . clock . artwork',
    wallTh: 0.40, floorTh: 0.40, ceilingTh: 0.42, furnitureTh: 0.28, secondaryTh: 0.24,
  },
  garden: {
    wallA: 'exterior wall, boundary wall, garden wall, brick wall',
    wallB: 'fence, wooden fence, stone wall, outdoor wall surface',
    floorA: 'garden floor, lawn, grass, patio floor, paving stones',
    floorB: 'ground surface, outdoor ground, pathway, decking',
    ceilingA: 'sky, open sky',
    ceilingB: 'outdoor overhead, pergola, awning',
    furniture: 'outdoor sofa . garden chair . patio table . bench . swing . sun lounger',
    secondary: 'plant . tree . bush . flower pot . planter . outdoor light . lantern . umbrella . fountain',
    wallTh: 0.38, floorTh: 0.38, ceilingTh: 0.40, furnitureTh: 0.25, secondaryTh: 0.20,
  }
};

export function buildStage1(imageFilename, opts = {}) {
  // Map standard frontend room types to our library
  const typeMap = {
    'living_room': 'living',
    'Living Room': 'living',
    'bedroom': 'bedroom',
    'Bedroom': 'bedroom',
    'kitchen': 'kitchen',
    'Kitchen': 'kitchen',
    'dining_room': 'dining',
    'Dining Room': 'dining',
    'bathroom': 'bathroom',
    'Bathroom': 'bathroom',
    'office': 'office',
    'Home Office': 'office',
    'garden': 'garden',
    'Garden/Outdoor': 'garden',
  };
  
  const roomTypeKey = typeMap[opts.roomType] || 'general';
  const prompts = PROMPT_LIBRARY[roomTypeKey] || PROMPT_LIBRARY.general;
  const blurSigma = 1.5;
  const sam2Model = 'sam2_hiera_small.pt'; // Fast & effective, avoids OOM
  const depthRes = 1024;
  
  const workflow = {};
  
  // ── 1. Load Image ─────────────────────────────────────────────────────────────
  workflow['1'] = { class_type: 'LoadImage', inputs: { image: imageFilename, upload: 'image' } };

  // ── 2. CLIPSeg Model (shared) ─────────────────────────────────────────────────
  workflow['2'] = { class_type: 'DownloadAndLoadCLIPSeg', inputs: { model: 'CIDAS/clipseg-rd64-refined' } };

  // ── 3-3b. Wall Detection (dual-prompt OR ensemble) ────────────────────────────
  workflow['3'] = {
    class_type: 'BatchCLIPSeg',
    inputs: { images: ['1', 0], opt_model: ['2', 0], text: prompts.wallA, threshold: prompts.wallTh, binary_mask: false, combine_mask: true, use_cuda: true, blur_sigma: blurSigma },
  };
  workflow['3b'] = {
    class_type: 'BatchCLIPSeg',
    inputs: { images: ['1', 0], opt_model: ['2', 0], text: prompts.wallB, threshold: prompts.wallTh, binary_mask: false, combine_mask: true, use_cuda: true, blur_sigma: blurSigma },
  };

  // ── 4-4b. Floor Detection ─────────────────────────────────────────────────────
  workflow['4'] = {
    class_type: 'BatchCLIPSeg',
    inputs: { images: ['1', 0], opt_model: ['2', 0], text: prompts.floorA, threshold: prompts.floorTh, binary_mask: false, combine_mask: true, use_cuda: true, blur_sigma: blurSigma },
  };
  workflow['4b'] = {
    class_type: 'BatchCLIPSeg',
    inputs: { images: ['1', 0], opt_model: ['2', 0], text: prompts.floorB, threshold: prompts.floorTh, binary_mask: false, combine_mask: true, use_cuda: true, blur_sigma: blurSigma },
  };

  // ── 5c-5d. Ceiling Detection ───────────────────────────────────────
  workflow['5c'] = {
    class_type: 'BatchCLIPSeg',
    inputs: { images: ['1', 0], opt_model: ['2', 0], text: prompts.ceilingA, threshold: prompts.ceilingTh, binary_mask: false, combine_mask: true, use_cuda: true, blur_sigma: blurSigma },
  };
  workflow['5d'] = {
    class_type: 'BatchCLIPSeg',
    inputs: { images: ['1', 0], opt_model: ['2', 0], text: prompts.ceilingB, threshold: prompts.ceilingTh, binary_mask: false, combine_mask: true, use_cuda: true, blur_sigma: blurSigma },
  };

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
    inputs: { sam_model: ['7', 0], grounding_dino_model: ['6', 0], image: ['1', 0], prompt: prompts.furniture, threshold: prompts.furnitureTh, keep_model_loaded: true },
  };

  // ── 9. Pass 2: Secondary/Clutter Detection ────────────────────────────────────
  workflow['9'] = {
    class_type: 'GroundingDinoSAM2Segment (segment anything2)',
    inputs: { sam_model: ['7', 0], grounding_dino_model: ['6', 0], image: ['1', 0], prompt: prompts.secondary, threshold: prompts.secondaryTh, keep_model_loaded: false },
  };

  // ── 10-13. OR Combinations ────────────────────────────────────────────────────
  workflow['10'] = { class_type: 'MaskComposite', inputs: { destination: ['3', 0], source: ['3b', 0], x: 0, y: 0, operation: 'or' } };
  workflow['11'] = { class_type: 'MaskComposite', inputs: { destination: ['4', 0], source: ['4b', 0], x: 0, y: 0, operation: 'or' } };
  workflow['12'] = { class_type: 'MaskComposite', inputs: { destination: ['5c', 0], source: ['5d', 0], x: 0, y: 0, operation: 'or' } };
  // GroundingDinoSAM2Segment output slot 1 is MASK
  workflow['13'] = { class_type: 'MaskComposite', inputs: { destination: ['8', 1], source: ['9', 1], x: 0, y: 0, operation: 'or' } };

  // ── 14-16. Threshold Cleanup ──────────────────────────────────────────────────
  workflow['14'] = { class_type: 'ThresholdMask', inputs: { mask: ['10', 0], value: 0.35 } };
  workflow['15'] = { class_type: 'ThresholdMask', inputs: { mask: ['11', 0], value: 0.35 } };
  workflow['16'] = { class_type: 'ThresholdMask', inputs: { mask: ['12', 0], value: 0.35 } };

  // ── 17-20. Subtraction Chain ──────────────────────────────────────────────────
  // Wall - Floor → removes floor bleed from wall mask
  workflow['17'] = { class_type: 'MaskComposite', inputs: { destination: ['14', 0], source: ['15', 0], x: 0, y: 0, operation: 'subtract' } };
  // Wall - Objects → clean wall-only mask
  workflow['18'] = { class_type: 'MaskComposite', inputs: { destination: ['17', 0], source: ['13', 0], x: 0, y: 0, operation: 'subtract' } };
  // Floor - Objects → floor without furniture footprints
  workflow['19'] = { class_type: 'MaskComposite', inputs: { destination: ['15', 0], source: ['13', 0], x: 0, y: 0, operation: 'subtract' } };
  // Ceiling - Objects (fans, lights)
  workflow['20'] = { class_type: 'MaskComposite', inputs: { destination: ['16', 0], source: ['13', 0], x: 0, y: 0, operation: 'subtract' } };

  // ── 21-23. GrowMaskWithBlur Refinement ────────────────────────────────────────
  // Wall: aggressive hole filling + edge smoothing
  workflow['21'] = { class_type: 'GrowMaskWithBlur', inputs: { mask: ['18', 0], expand: 6, incremental_expandrate: 0.0, tapered_corners: true, flip_input: false, blur_radius: 4.0, lerp_alpha: 1.0, decay_factor: 1.0, fill_holes: true } };
  // Floor: moderate smoothing, hole filling for under-furniture gaps
  workflow['22'] = { class_type: 'GrowMaskWithBlur', inputs: { mask: ['19', 0], expand: 3, incremental_expandrate: 0.0, tapered_corners: true, flip_input: false, blur_radius: 2.0, lerp_alpha: 1.0, decay_factor: 1.0, fill_holes: true } };
  // Objects: gentle edge smoothing, NO hole filling (preserve object shapes)
  workflow['23'] = { class_type: 'GrowMaskWithBlur', inputs: { mask: ['13', 0], expand: 3, incremental_expandrate: 0.0, tapered_corners: true, flip_input: false, blur_radius: 2.0, lerp_alpha: 1.0, decay_factor: 1.0, fill_holes: false } };

  // ── 24. Empty Space = Refined Floor - Refined Objects ─────────────────────────
  workflow['24'] = { class_type: 'MaskComposite', inputs: { destination: ['22', 0], source: ['23', 0], x: 0, y: 0, operation: 'subtract' } };

  // ── 25. Depth Map ─────────────────────────────────────────────────────────────
  workflow['25'] = { class_type: 'DepthAnythingV2Preprocessor', inputs: { image: ['1', 0], ckpt_name: 'depth_anything_v2_vits.pth', resolution: depthRes } };

  // ── 26-30. MaskToImage Conversions ────────────────────────────────────────────
  workflow['26'] = { class_type: 'MaskToImage', inputs: { mask: ['21', 0] } };  // wall
  workflow['27'] = { class_type: 'MaskToImage', inputs: { mask: ['22', 0] } };  // floor
  workflow['28'] = { class_type: 'MaskToImage', inputs: { mask: ['20', 0] } };  // ceiling
  workflow['29'] = { class_type: 'MaskToImage', inputs: { mask: ['23', 0] } };  // objects
  workflow['30'] = { class_type: 'MaskToImage', inputs: { mask: ['24', 0] } };  // empty space

  // ── 31-36. SaveImage Outputs ──────────────────────────────────────────────────
  workflow['31'] = { class_type: 'SaveImage', inputs: { images: ['26', 0], filename_prefix: 'stage1/wall_mask' } };
  workflow['32'] = { class_type: 'SaveImage', inputs: { images: ['27', 0], filename_prefix: 'stage1/floor_mask' } };
  workflow['33'] = { class_type: 'SaveImage', inputs: { images: ['28', 0], filename_prefix: 'stage1/ceiling_mask' } };
  workflow['34'] = { class_type: 'SaveImage', inputs: { images: ['29', 0], filename_prefix: 'stage1/object_mask' } };
  workflow['35'] = { class_type: 'SaveImage', inputs: { images: ['30', 0], filename_prefix: 'stage1/empty_mask' } };
  workflow['36'] = { class_type: 'SaveImage', inputs: { images: ['25', 0], filename_prefix: 'stage1/depth_map' } };

  return workflow;
}

// ─── Stable Stage 1: Pure GroundingDINO + SAM2 (no CLIPSeg) ─────────────────
// Drop-in replacement for buildStage1 — outputs identical filename_prefixes.
// Uses 5 GroundingDINO+SAM2 passes (wall, floor, ceiling, furniture, secondary),
// subtraction chain for clean non-overlapping masks, GrowMaskWithBlur post-processing,
// and DepthAnythingV2.
//
// Peak VRAM: ~900MB (safe for RTX 4060 8GB)
// CLIPSeg is NOT used — all structural surfaces detected by GroundingDINO.

const STABLE_PROMPTS = {
  general: {
    furniture: 'sofa . table . chair . bed . cabinet . shelf . wardrobe . desk . dresser . stool',
    secondary: 'lamp . ceiling fan . curtain . rug . carpet . plant . television . mirror . decoration . air conditioner . clock . picture frame',
    catchall: 'furniture . object . item . appliance . fixture . equipment . belonging',
    wall: 'wall . painted wall . interior wall . room wall . wallpaper',
    floor: 'floor . tile floor . wooden floor . marble floor . carpet floor . flooring',
    ceiling: 'ceiling . room ceiling . false ceiling . overhead surface',
    furnitureTh: 0.22, secondaryTh: 0.18, catchallTh: 0.15, wallTh: 0.30, floorTh: 0.30, ceilingTh: 0.32,
  },
  living: {
    furniture: 'sofa . couch . sofa set . center table . coffee table . TV unit . entertainment unit . recliner . armchair . display cabinet . bookshelf . side table . shoe rack',
    secondary: 'ceiling fan . table lamp . floor lamp . curtain . rug . carpet . plant . television . air conditioner . wall clock . speaker . photo frame . idol . vase . cushion',
    catchall: 'furniture . seating . table . storage . appliance . object . fixture',
    wall: 'wall . living room wall . accent wall . painted wall . textured wall . wallpaper',
    floor: 'floor . marble floor . vitrified tile . stone floor . carpet . polished floor',
    ceiling: 'ceiling . false ceiling . POP ceiling . ceiling with lights . decorative ceiling',
    furnitureTh: 0.20, secondaryTh: 0.17, catchallTh: 0.13, wallTh: 0.28, floorTh: 0.28, ceilingTh: 0.30,
  },
  bedroom: {
    furniture: 'bed . bed frame . headboard . nightstand . bedside table . wardrobe . closet . dresser . dressing table . vanity mirror . study desk . chair . chest of drawers . almirah',
    secondary: 'ceiling fan . table lamp . bedside lamp . curtain . rug . air conditioner . mirror . wall decor . photo frame . clock . plant . pillow . cushion . blanket',
    catchall: 'furniture . bed . storage . seating . object . fixture . appliance',
    wall: 'wall . bedroom wall . headboard wall . accent wall . wallpaper . textured wall',
    floor: 'floor . bedroom floor . marble floor . tile floor . wooden floor . carpet',
    ceiling: 'ceiling . bedroom ceiling . false ceiling . ceiling with fan',
    furnitureTh: 0.20, secondaryTh: 0.18, catchallTh: 0.13, wallTh: 0.28, floorTh: 0.28, ceilingTh: 0.30,
  },
  kitchen: {
    furniture: 'kitchen cabinet . upper cabinet . lower cabinet . counter . countertop . kitchen island . dining table . dining chair . storage rack . refrigerator . microwave stand . dish rack',
    secondary: 'chimney . exhaust fan . light fixture . gas stove . microwave . mixer grinder . water purifier . spice rack . utensil holder . plant . pressure cooker . steel container',
    catchall: 'cabinet . appliance . kitchen item . fixture . cooking equipment . storage',
    wall: 'wall . kitchen wall . tiled wall . backsplash . wall above counter',
    floor: 'floor . kitchen floor . tile floor . anti-skid floor . stone floor',
    ceiling: 'ceiling . kitchen ceiling . ceiling above counter',
    furnitureTh: 0.20, secondaryTh: 0.17, catchallTh: 0.13, wallTh: 0.30, floorTh: 0.28, ceilingTh: 0.32,
  },
  dining: {
    furniture: 'dining table . dining chair . sideboard . buffet table . display cabinet . crockery cabinet . bar unit . serving trolley . dining bench',
    secondary: 'chandelier . pendant light . curtain . rug . plant . wall art . mirror . clock . vase . flower arrangement . candle holder . table runner',
    catchall: 'table . chair . furniture . object . fixture . seating',
    wall: 'wall . dining room wall . accent wall . wall with artwork . textured wall',
    floor: 'floor . dining room floor . marble floor . tile floor . wooden floor',
    ceiling: 'ceiling . dining room ceiling . ceiling with chandelier . decorative ceiling',
    furnitureTh: 0.20, secondaryTh: 0.18, catchallTh: 0.13, wallTh: 0.28, floorTh: 0.28, ceilingTh: 0.30,
  },
  bathroom: {
    furniture: 'toilet . bathtub . shower enclosure . vanity . sink . wash basin . cabinet . mirror cabinet . towel rack . washing machine . geyser',
    secondary: 'mirror . shower head . faucet . towel . light fixture . exhaust fan . water heater . soap dispenser . bucket . mug',
    catchall: 'bathroom fixture . sanitary ware . appliance . object . fitting',
    wall: 'wall . bathroom wall . tiled wall . shower wall . ceramic wall',
    floor: 'floor . bathroom floor . wet area floor . anti-skid tiles . shower floor',
    ceiling: 'ceiling . bathroom ceiling . false ceiling',
    furnitureTh: 0.22, secondaryTh: 0.20, catchallTh: 0.15, wallTh: 0.30, floorTh: 0.30, ceilingTh: 0.32,
  },
  office: {
    furniture: 'desk . office chair . bookshelf . filing cabinet . study table . shelving unit . computer table . ergonomic chair',
    secondary: 'lamp . computer . monitor . laptop . curtain . blind . plant . books . clock . artwork . printer . whiteboard',
    catchall: 'office furniture . equipment . object . fixture . appliance',
    wall: 'wall . office wall . study wall . painted wall',
    floor: 'floor . office floor . wooden floor . carpet floor . tile floor',
    ceiling: 'ceiling . office ceiling . false ceiling',
    furnitureTh: 0.20, secondaryTh: 0.18, catchallTh: 0.13, wallTh: 0.28, floorTh: 0.28, ceilingTh: 0.30,
  },
  pooja: {
    furniture: 'temple . mandir . pooja shelf . wooden temple . marble temple . cabinet . storage unit . pooja stand . altar',
    secondary: 'idol . statue . brass item . diya . oil lamp . bell . incense holder . agarbatti stand . flower vase . garland . picture frame . light fixture . kalash . puja thali',
    catchall: 'religious object . idol . fixture . object . item . devotional item',
    wall: 'wall . pooja room wall . decorated wall . marble wall . wall behind temple',
    floor: 'floor . pooja room floor . marble floor . clean floor . floor near temple',
    ceiling: 'ceiling . pooja room ceiling . decorated ceiling',
    furnitureTh: 0.18, secondaryTh: 0.15, catchallTh: 0.12, wallTh: 0.28, floorTh: 0.28, ceilingTh: 0.32,
  },
  cluttered: {
    furniture: 'sofa . table . chair . bed . cabinet . shelf . wardrobe . desk . stool . trunk . box . chest . rack . almirah',
    secondary: 'lamp . fan . curtain . rug . plant . television . mirror . decoration . bag . books . toys . basket . container . appliance . idol . clock . air conditioner',
    catchall: 'object . item . furniture . thing . clutter . belonging . appliance',
    wall: 'wall . visible wall . wall behind furniture . wall gap . exposed wall surface',
    floor: 'floor . visible floor . floor between furniture . floor gap . tile floor',
    ceiling: 'ceiling . room ceiling . overhead surface',
    furnitureTh: 0.17, secondaryTh: 0.14, catchallTh: 0.11, wallTh: 0.25, floorTh: 0.25, ceilingTh: 0.30,
  },
};

/**
 * Build Stage 1 using ONLY GroundingDINO + SAM2 (no CLIPSeg).
 * Drop-in replacement for buildStage1() — same output filename prefixes,
 * same keys in _extractFilenames output.
 *
 * @param {string} imageFilename - Input image in ComfyUI/input/
 * @param {object} opts
 * @param {string} [opts.roomType] - Room type for optimized prompts
 * @returns {object} ComfyUI API-format workflow
 */
export function buildStableStage1(imageFilename, opts = {}) {
  const typeMap = {
    'living_room': 'living', 'Living Room': 'living',
    'bedroom': 'bedroom',   'Bedroom': 'bedroom',
    'kitchen': 'kitchen',    'Kitchen': 'kitchen',
    'dining_room': 'dining', 'Dining Room': 'dining',
    'bathroom': 'bathroom',  'Bathroom': 'bathroom',
    'office': 'office',      'Home Office': 'office',
    'pooja_room': 'pooja',   'Pooja Room': 'pooja',
    'cluttered': 'cluttered',
  };

  const roomTypeKey = typeMap[opts.roomType] || 'general';
  const prompts = STABLE_PROMPTS[roomTypeKey] || STABLE_PROMPTS.general;

  const w = {};

  // ── 1. Load Image ──────────────────────────────────────────────────
  w['1'] = { class_type: 'LoadImage', inputs: { image: imageFilename, upload: 'image' } };

  // ── 2-3. Model Loading (shared across all 5 passes) ────────────────
  w['2'] = { class_type: 'GroundingDinoModelLoader (segment anything2)', inputs: { model_name: 'GroundingDINO_SwinT_OGC (694MB)' } };
  w['3'] = { class_type: 'SAM2ModelLoader (segment anything2)', inputs: { model_name: 'sam2_hiera_small.pt' } };

  // ── 10-15. Six GroundingDINO+SAM2 Passes ─────────────────────────
  // Object passes: furniture (specific), secondary (decor/small), catchall (broad low-threshold)
  // Structural passes: wall, floor, ceiling
  // Output: slot 0 = IMAGE (vis), slot 1 = MASK (binary)
  w['10'] = { class_type: 'GroundingDinoSAM2Segment (segment anything2)', inputs: { sam_model: ['3',0], grounding_dino_model: ['2',0], image: ['1',0], prompt: prompts.furniture, threshold: prompts.furnitureTh, keep_model_loaded: true } };
  w['11'] = { class_type: 'GroundingDinoSAM2Segment (segment anything2)', inputs: { sam_model: ['3',0], grounding_dino_model: ['2',0], image: ['1',0], prompt: prompts.secondary, threshold: prompts.secondaryTh, keep_model_loaded: true } };
  // Pass 3: broad catchall — catches anything DINO missed in passes 1 & 2 (very low threshold)
  w['10c'] = { class_type: 'GroundingDinoSAM2Segment (segment anything2)', inputs: { sam_model: ['3',0], grounding_dino_model: ['2',0], image: ['1',0], prompt: prompts.catchall, threshold: prompts.catchallTh, keep_model_loaded: true } };
  w['12'] = { class_type: 'GroundingDinoSAM2Segment (segment anything2)', inputs: { sam_model: ['3',0], grounding_dino_model: ['2',0], image: ['1',0], prompt: prompts.wall, threshold: prompts.wallTh, keep_model_loaded: true } };
  w['13'] = { class_type: 'GroundingDinoSAM2Segment (segment anything2)', inputs: { sam_model: ['3',0], grounding_dino_model: ['2',0], image: ['1',0], prompt: prompts.floor, threshold: prompts.floorTh, keep_model_loaded: true } };
  w['14'] = { class_type: 'GroundingDinoSAM2Segment (segment anything2)', inputs: { sam_model: ['3',0], grounding_dino_model: ['2',0], image: ['1',0], prompt: prompts.ceiling, threshold: prompts.ceilingTh, keep_model_loaded: false } };

  // ── 15. Depth Map (after DINO+SAM2 unloaded) ──────────────────────
  w['15'] = { class_type: 'DepthAnythingV2Preprocessor', inputs: { image: ['1',0], ckpt_name: 'depth_anything_v2_vits.pth', resolution: 1024 } };

  // ── 20. Combine Objects: furniture OR secondary OR catchall (3-way union) ──
  w['20a'] = { class_type: 'MaskComposite', inputs: { destination: ['10',1], source: ['11',1], x: 0, y: 0, operation: 'or' } };
  w['20']  = { class_type: 'MaskComposite', inputs: { destination: ['20a',0], source: ['10c',1], x: 0, y: 0, operation: 'or' } };

  // ── 21a,21,22,23. Subtraction Chain ────────────────────────────────
  // wall − floor → remove floor bleed
  w['21a'] = { class_type: 'MaskComposite', inputs: { destination: ['12',1], source: ['13',1], x: 0, y: 0, operation: 'subtract' } };
  // (wall − floor) − objects → clean wall
  w['21'] = { class_type: 'MaskComposite', inputs: { destination: ['21a',0], source: ['20',0], x: 0, y: 0, operation: 'subtract' } };
  // floor − objects → clean floor
  w['22'] = { class_type: 'MaskComposite', inputs: { destination: ['13',1], source: ['20',0], x: 0, y: 0, operation: 'subtract' } };
  // ceiling − objects → clean ceiling
  w['23'] = { class_type: 'MaskComposite', inputs: { destination: ['14',1], source: ['20',0], x: 0, y: 0, operation: 'subtract' } };

  // ── 30-33. GrowMaskWithBlur Post-Processing ────────────────────────
  // Wall: aggressive hole filling + edge smoothing
  w['30'] = { class_type: 'GrowMaskWithBlur', inputs: { mask: ['21',0], expand: 6, incremental_expandrate: 0.0, tapered_corners: true, flip_input: false, blur_radius: 4.0, lerp_alpha: 1.0, decay_factor: 1.0, fill_holes: true } };
  // Floor: moderate smoothing, fill gaps
  w['31'] = { class_type: 'GrowMaskWithBlur', inputs: { mask: ['22',0], expand: 3, incremental_expandrate: 0.0, tapered_corners: true, flip_input: false, blur_radius: 2.0, lerp_alpha: 1.0, decay_factor: 1.0, fill_holes: true } };
  // Objects: FIXED — fill_holes: true (fills gaps inside furniture shapes), expand: 5 (was 3)
  // Larger expand needed because catchall pass adds thin/partial detections that need merging
  w['32'] = { class_type: 'GrowMaskWithBlur', inputs: { mask: ['20',0], expand: 5, incremental_expandrate: 0.0, tapered_corners: true, flip_input: false, blur_radius: 2.5, lerp_alpha: 1.0, decay_factor: 1.0, fill_holes: true } };
  // Ceiling: standard smoothing
  w['33'] = { class_type: 'GrowMaskWithBlur', inputs: { mask: ['23',0], expand: 2, incremental_expandrate: 0.0, tapered_corners: true, flip_input: false, blur_radius: 2.0, lerp_alpha: 1.0, decay_factor: 1.0, fill_holes: true } };

  // ── 34. Empty Space = refined floor − refined objects ──────────────
  w['34'] = { class_type: 'MaskComposite', inputs: { destination: ['31',0], source: ['32',0], x: 0, y: 0, operation: 'subtract' } };

  // ── 40-44. MaskToImage ─────────────────────────────────────────────
  w['40'] = { class_type: 'MaskToImage', inputs: { mask: ['30',0] } };
  w['41'] = { class_type: 'MaskToImage', inputs: { mask: ['31',0] } };
  w['42'] = { class_type: 'MaskToImage', inputs: { mask: ['32',0] } };
  w['43'] = { class_type: 'MaskToImage', inputs: { mask: ['33',0] } };
  w['44'] = { class_type: 'MaskToImage', inputs: { mask: ['34',0] } };

  // ── 50-55. SaveImage (same prefixes as buildStage1 for compat) ────
  w['50'] = { class_type: 'SaveImage', inputs: { images: ['40',0], filename_prefix: 'stage1/wall_mask' } };
  w['51'] = { class_type: 'SaveImage', inputs: { images: ['41',0], filename_prefix: 'stage1/floor_mask' } };
  w['52'] = { class_type: 'SaveImage', inputs: { images: ['42',0], filename_prefix: 'stage1/object_mask' } };
  w['53'] = { class_type: 'SaveImage', inputs: { images: ['43',0], filename_prefix: 'stage1/ceiling_mask' } };
  w['54'] = { class_type: 'SaveImage', inputs: { images: ['44',0], filename_prefix: 'stage1/empty_mask' } };
  w['55'] = { class_type: 'SaveImage', inputs: { images: ['15',0], filename_prefix: 'stage1/depth_map' } };

  return w;
}


// ─── Stage 2: Geometry Locking (Canny ControlNet + Depth-Canny pass) ─────────
// Uses controlnet-canny-sdxl.safetensors (only ControlNet confirmed installed).
// Pass 1: Canny on original image (primary structural lock — walls/edges)
// Pass 2: Canny on depth map from Stage 1 (spatial/depth guidance — room geometry)
// Accepts optional structural lock params from ProfessionalSelector.

export function buildStage2(imageFilename, depthMapFilename, { masterSelector, masterToggles, roomType, structuralLock = {}, encoderV2 = {} }) {
  const parts = [`photorealistic interior of a ${roomType}`];
  // Wall color is NOT included in Stage 2 prompt when masterToggles.walls is true —
  // Stage 3 handles wall color via masked inpainting (VAEEncodeForInpaint + CLIPSeg mask).
  // Including it here causes unmasked full img2img to tint objects with wall color.
  if (masterToggles?.walls === false && masterSelector.wallColor && masterSelector.wallColor !== 'keep_original') {
    parts.push(`${masterSelector.wallColor} walls`);
  }
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

  // Wire ArchAi3D Encoder V2 settings into KSampler params:
  // - contextStrength (0.7-0.95): Higher = preserve more of original → lower denoise
  //   Maps 0.95 → denoise 0.55, 0.70 → denoise 0.85 (inverse relationship)
  // - userTextStrength (0.4-0.8): Higher = follow text prompts more → higher cfg
  //   Maps 0.4 → cfg 5.0, 0.8 → cfg 9.0
  const ctxStr = encoderV2.contextStrength ?? 0.85;
  const txtStr = encoderV2.userTextStrength ?? 0.6;
  const denoise = parseFloat((1.15 - ctxStr * 0.65).toFixed(2));   // 0.95→0.53, 0.85→0.60, 0.70→0.70
  const cfg     = parseFloat((5.0 + (txtStr - 0.4) * 10.0).toFixed(1)); // 0.4→5.0, 0.6→7.0, 0.8→9.0

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
    // denoise and cfg driven by encoderV2 settings (contextStrength, userTextStrength)
    "8":  { class_type: "VAEEncode",               inputs: { pixels: ["2",0], vae: ["1",2] } },
    "9":  { class_type: "KSampler",                inputs: { seed: seed(), steps: 25, cfg, sampler_name: "dpmpp_2m", scheduler: "karras", denoise, model: ["1",0], positive: ["7b",0], negative: ["7b",1], latent_image: ["8",0] } },
    "10": { class_type: "VAEDecode",               inputs: { samples: ["9",0], vae: ["1",2] } },
    "11": { class_type: "SaveImage",               inputs: { images: ["10",0], filename_prefix: "stage2/redesigned" } },
  };
}


// ─── Stage 3: Sequential Inpainting (replaces RegionalSampler) ───────
// Conditionally inpaints walls and/or furniture based on masterToggles.
// When masterToggles.walls is true → inpaint walls with CLIPSeg mask + wall color prompt.
// When masterToggles.furniture is true → inpaint furniture with object mask + style prompt.
// Includes Canny ControlNet to preserve room structure during any inpainting.

export function buildStage3(redesignedImage, wallMask, objectMask, { wallPrompt, furniturePrompt, masterToggles = {} }) {
  const doWallInpaint = masterToggles?.walls === true;

  if (!doWallInpaint) {
    return {
      "1": { class_type: "LoadImage", inputs: { image: redesignedImage, upload: "image" } },
      "2": { class_type: "SaveImage", inputs: { images: ["1",0], filename_prefix: "stage3/regional_inpainted" } },
    };
  }

  return {
    "1":  { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "sd_xl_base_1.0.safetensors" } },
    "2":  { class_type: "LoadImage", inputs: { image: redesignedImage, upload: "image" } },

    // ── Masks ──────────────────────────────────────────────────────────────────
    // Load wall mask and object mask as separate MASK types
    "3":  { class_type: "LoadImage", inputs: { image: wallMask, upload: "image" } },
    "4":  { class_type: "LoadImage", inputs: { image: objectMask, upload: "image" } },
    "5":  { class_type: "ImageToMask", inputs: { image: ["3",0], channel: "red" } },
    "6":  { class_type: "ImageToMask", inputs: { image: ["4",0], channel: "red" } },
    // KEY FIX: Subtract object mask from wall mask so furniture pixels are NEVER painted
    // CLIPSeg wall masks often bleed into furniture — this guarantees a clean wall-only region
    "7":  { class_type: "MaskComposite", inputs: { destination: ["5",0], source: ["6",0], x: 0, y: 0, operation: "subtract" } },

    // ── ControlNet structural lock ─────────────────────────────────────────────
    "20": { class_type: "CannyEdgePreprocessor", inputs: { image: ["2",0], low_threshold: 80, high_threshold: 180, resolution: 1024 } },
    "21": { class_type: "ControlNetLoader", inputs: { control_net_name: "controlnet-canny-sdxl.safetensors" } },

    // ── Prompts ────────────────────────────────────────────────────────────────
    "9":  { class_type: "CLIPTextEncode", inputs: { text: wallPrompt, clip: ["1",1] } },
    "10": { class_type: "CLIPTextEncode", inputs: { text: "blurry, low quality, distorted, grey walls, white walls, beige walls, colorless, deformed furniture, floating objects", clip: ["1",1] } },
    "22": { class_type: "ControlNetApplyAdvanced", inputs: { positive: ["9",0], negative: ["10",0], control_net: ["21",0], image: ["20",0], strength: 0.52, start_percent: 0.0, end_percent: 0.70 } },
    // Use node 7 (wall MINUS furniture) — furniture pixels are never in this mask
    "11": { class_type: "VAEEncodeForInpaint", inputs: { pixels: ["2",0], vae: ["1",2], mask: ["7",0], grow_mask_by: 0 } },
    // denoise: 0.77 — apply wall color without over-generating
    // (0.83 caused distortion; 0.70 was too low and reverted to grey)
    "12": { class_type: "KSampler", inputs: { seed: seed(), steps: 20, cfg: 7.5, sampler_name: "dpmpp_2m", scheduler: "karras", denoise: 0.77, model: ["1",0], positive: ["22",0], negative: ["22",1], latent_image: ["11",0] } },
    "13": { class_type: "VAEDecode", inputs: { samples: ["12",0], vae: ["1",2] } },
    "18": { class_type: "SaveImage", inputs: { images: ["13",0], filename_prefix: "stage3/regional_inpainted" } },
  };

}

// ─── Stage 4: IPAdapter Furniture ────────────────────────────────────
// Requires IPAdapter Plus for SDXL + CLIP Vision ViT-H weights.
// Uses canny on depth map for spatial guidance (depth ControlNet not installed).

export function buildStage4(stage3Image, styleRef, furnitureImage, objectMask, depthMap, furniturePrompt) {
  // Build positive prompt: use passed furniture style or fall back to generic
  const posPrompt = furniturePrompt
    ? `${furniturePrompt}, professional architectural interior photography, realistic proportions, 8k`
    : '(professional architectural interior photography:1.3), elegant furniture placement, cohesive design, realistic proportions, 8k';
  const negPrompt = 'blurry, low quality, floating furniture, unrealistic proportions, mismatched style, cartoon, watermark, grey sofa, grey furniture, grey upholstery, dull, colorless, washed out, faded furniture';
  
  return {
    "1":  { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "sd_xl_base_1.0.safetensors" } },
    "2":  { class_type: "LoadImage", inputs: { image: stage3Image, upload: "image" } },
    "4":  { class_type: "LoadImage", inputs: { image: furnitureImage, upload: "image" } },
    "5":  { class_type: "LoadImage", inputs: { image: objectMask, upload: "image" } },
    "6":  { class_type: "LoadImage", inputs: { image: depthMap, upload: "image" } },
    "7":  { class_type: "IPAdapterUnifiedLoader", inputs: { model: ["1",0], preset: "PLUS (high strength)" } },

    // Prep furniture image — pad preserves full object shape without cropping
    "9":  { class_type: "PrepImageForClipVision", inputs: { image: ["4",0], interpolation: "LANCZOS", crop_position: "pad", sharpening: 0.1 } },

    // Object mask → MASK type (used for both attn_mask and VAEEncodeForInpaint)
    "10": { class_type: "ImageToMask", inputs: { image: ["5",0], channel: "red" } },

    // IPAdapter: gently style the furniture area toward the uploaded reference
    // weight: 0.60 — balanced: preserves room structure, still visibly influences furniture appearance
    // (0.90 was too strong: model regenerated the whole room to match reference)
    // weight_type: linear — most predictable for furniture stylizing
    "12": { class_type: "IPAdapterAdvanced", inputs: {
      model: ["7",0], ipadapter: ["7",1], image: ["9",0],
      weight: 0.60, weight_type: "linear",
      combine_embeds: "concat", start_at: 0.0, end_at: 0.80,
      embeds_scaling: "V only", attn_mask: ["10",0]
    }},

    // Text guidance: use the user's furniture style selection + reject grey
    "13": { class_type: "CLIPTextEncode", inputs: { text: posPrompt, clip: ["1",1] } },
    "14": { class_type: "CLIPTextEncode", inputs: { text: negPrompt, clip: ["1",1] } },

    // Light ControlNet from depth map edges — 0.40 strength preserves room geometry
    "15": { class_type: "CannyEdgePreprocessor", inputs: { image: ["6",0], low_threshold: 80, high_threshold: 180, resolution: 1024 } },
    "16": { class_type: "ControlNetLoader", inputs: { control_net_name: "controlnet-canny-sdxl.safetensors" } },
    "17": { class_type: "ControlNetApplyAdvanced", inputs: { positive: ["13",0], negative: ["14",0], control_net: ["16",0], image: ["15",0], strength: 0.40, start_percent: 0.0, end_percent: 0.70 } },
    // VAEEncodeForInpaint: grow_mask_by: 4 (was 8) — smaller region, less table area affected
    "18": { class_type: "VAEEncodeForInpaint", inputs: { pixels: ["2",0], vae: ["1",2], mask: ["10",0], grow_mask_by: 4 } },
    // denoise: 0.40 — low enough that table/non-sofa areas barely change color
    // IPAdapter weight 0.60 still shifts the sofa toward the reference; table is mostly preserved
    "19": { class_type: "KSampler", inputs: { seed: seed(), steps: 20, cfg: 6.5, sampler_name: "dpmpp_2m", scheduler: "karras", denoise: 0.40, model: ["12",0], positive: ["17",0], negative: ["17",1], latent_image: ["18",0] } },
    "20": { class_type: "VAEDecode", inputs: { samples: ["19",0], vae: ["1",2] } },
    "21": { class_type: "SaveImage", inputs: { images: ["20",0], filename_prefix: "stage4/furniture_placed" } },
  };
}

// ─── Stage 5: Iterative Refinement ───────────────────────────────────
// Light inpainting pass over wall+furniture masks for detail enhancement.
// Separated from Stage 6 so each can be independently skipped.

export function buildStage5(stage4Image, wallMask, objectMask) {
  return {
    "1":  { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "sd_xl_base_1.0.safetensors" } },
    "2":  { class_type: "LoadImage", inputs: { image: stage4Image, upload: "image" } },
    "4":  { class_type: "LoadImage", inputs: { image: objectMask, upload: "image" } },

    // Detail-quality prompts (no color specifics — this is a sharpening pass only)
    "5":  { class_type: "CLIPTextEncode", inputs: { text: "(professional architectural interior photography:1.3), ultra sharp details, pristine surfaces, photorealistic, (8k RAW photo:1.2), masterpiece", clip: ["1",1] } },
    "6":  { class_type: "CLIPTextEncode", inputs: { text: "blurry, low quality, noise, artifacts, jpeg compression, pixelated, cartoon, watermark, distorted, oversaturated", clip: ["1",1] } },

    // Object mask only — walls are untouched so Stage 3 color is preserved end-to-end
    "8":  { class_type: "ImageToMask", inputs: { image: ["4",0], channel: "red" } },

    // denoise: 0.18 — true sharpening pass, not a regeneration pass
    // Low enough to only enhance texture detail without altering colors
    "10": { class_type: "VAEEncodeForInpaint", inputs: { pixels: ["2",0], vae: ["1",2], mask: ["8",0], grow_mask_by: 2 } },
    "11": { class_type: "KSampler", inputs: { seed: seed(), steps: 12, cfg: 4.0, sampler_name: "dpmpp_2m", scheduler: "karras", denoise: 0.18, model: ["1",0], positive: ["5",0], negative: ["6",0], latent_image: ["10",0] } },
    "12": { class_type: "VAEDecode", inputs: { samples: ["11",0], vae: ["1",2] } },
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
    depthMap = null,          // Pre-computed depth map from Stage 1 (if available)
    _hasSceneMasks = false,   // Set by enqueueSmartTabJob when masks are provided
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

    // ─── Apply ControlNet (primary structural lock) ───────────
    "7":  { class_type: "ControlNetApplyAdvanced", inputs: { positive: ["5",0], negative: ["6",0], control_net: ["4",0], image: ["3",0], strength: cannyStrength, start_percent: 0.0, end_percent: 1.0 } },

    // ─── Encode → Sample → Decode ─────────────────────────────
    "8":  { class_type: "VAEEncode",   inputs: { pixels: ["2",0], vae: ["1",2] } },
    "9":  { class_type: "KSampler",    inputs: { seed: seed(), steps: 25, cfg: 7.0, sampler_name: "dpmpp_2m", scheduler: "karras", denoise: strength, model: ["1",0], positive: ["7",0], negative: ["7",1], latent_image: ["8",0] } },
    "10": { class_type: "VAEDecode",   inputs: { samples: ["9",0], vae: ["1",2] } },
    "11": { class_type: "SaveImage",   inputs: { images: ["10",0], filename_prefix: "tab_render/result" } },
  };

  // ─── Optional: Depth-Canny second ControlNet pass ───────────
  // When Stage 1 provides a pre-computed depth map, run Canny on it
  // and chain as a secondary ControlNet (softer, early-only) for
  // better room-geometry preservation. Same approach as Stage 2.
  if (depthMap && _hasSceneMasks) {
    workflow["30"] = { class_type: "LoadImage", inputs: { image: depthMap, upload: "image" } };
    workflow["31"] = { class_type: "CannyEdgePreprocessor", inputs: { image: ["30",0], low_threshold: 50, high_threshold: 150, resolution: 1024 } };
    const depthCnStrength = parseFloat((cannyStrength * 0.60).toFixed(2));
    workflow["32"] = { class_type: "ControlNetApplyAdvanced", inputs: {
      positive: ["7",0], negative: ["7",1], control_net: ["4",0], image: ["31",0],
      strength: depthCnStrength, start_percent: 0.0, end_percent: 0.70
    }};
    // Redirect KSampler to use depth-enhanced conditioning
    workflow["9"].inputs.positive = ["32",0];
    workflow["9"].inputs.negative = ["32",1];
  }

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
    depthMap = null,          // Pre-computed depth map from Stage 1 (if available)
    _hasSceneMasks = false,   // Set by enqueueSmartTabJob
  } = opts;

  const workflow = {
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

  // ─── Optional: Depth ControlNet to preserve room geometry ───
  // When Stage 1 provides a depth map, use it as a soft ControlNet
  // to prevent perspective distortion in the edited region.
  if (depthMap && _hasSceneMasks) {
    workflow["20"] = { class_type: "LoadImage", inputs: { image: depthMap, upload: "image" } };
    workflow["21"] = { class_type: "CannyEdgePreprocessor", inputs: { image: ["20",0], low_threshold: 50, high_threshold: 150, resolution: 1024 } };
    workflow["22"] = { class_type: "ControlNetLoader", inputs: { control_net_name: "controlnet-canny-sdxl.safetensors" } };
    workflow["23"] = { class_type: "ControlNetApplyAdvanced", inputs: {
      positive: ["6",0], negative: ["7",0], control_net: ["22",0], image: ["21",0],
      strength: 0.40, start_percent: 0.0, end_percent: 0.60
    }};
    // Redirect KSampler to use depth-guided conditioning
    workflow["9"].inputs.positive = ["23",0];
    workflow["9"].inputs.negative = ["23",1];
  }

  return workflow;
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
