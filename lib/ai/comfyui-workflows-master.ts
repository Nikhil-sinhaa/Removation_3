// lib/ai/comfyui-workflows-master.ts
import { GenerationRequest } from "./comfyui-bridge";

// Re-export pure data constants from the client-safe module.
// Server code can still import them from here; client code should import
// from @/lib/ai/master-selector-options to avoid pulling in Node.js deps.
export {
  MASTER_SELECTOR_OPTIONS,
  ARCHAI3D_MATERIALS,
} from './master-selector-options';

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

export interface MasterGenerationRequest extends GenerationRequest {
  masterSelector: MasterSelectorOptions;
  masterToggles: MasterToggles;
  useArchAi3d: boolean;
  generationMode: 'selective' | 'complete' | 'remove_paint';
}

export function createMasterSelectorWorkflow(request: MasterGenerationRequest) {
  const { masterSelector, masterToggles, useArchAi3d, mode } = request;


  if (useArchAi3d) {
    return createArchAi3dWorkflow(request);
  }

  // Master Selector Workflow with String Concatenation
  return {
    "prompt": {
      // 1: Load Checkpoint
      "1": {
        "inputs": {
          "ckpt_name": "sd_xl_base_1.0.safetensors"
        },
        "class_type": "CheckpointLoaderSimple"
      },

      // 2: Load VAE
      "2": {
        "inputs": {
          "vae_name": "sdxl_vae.safetensors"
        },
        "class_type": "VAELoader"
      },

      // 3: Master Selector - Wall Color
      "3": {
        "inputs": {
          "text": masterToggles.walls ? masterSelector.wallColor : "original",
          "multiline": false
        },
        "class_type": "PrimitiveNode" // Text Select
      },

      // 4: Master Selector - Ceiling
      "4": {
        "inputs": {
          "text": masterToggles.ceiling ? masterSelector.ceiling : "original",
          "multiline": false
        },
        "class_type": "PrimitiveNode" // Text Select
      },

      // 5: Master Selector - Furniture Style
      "5": {
        "inputs": {
          "text": masterToggles.furniture ? masterSelector.furnitureStyle : "original",
          "multiline": false
        },
        "class_type": "PrimitiveNode" // Text Select
      },

      // 6: Master Selector - Floor Type
      "6": {
        "inputs": {
          "text": masterToggles.floor ? (masterSelector.floorType || "original") : "original",
          "multiline": false
        },
        "class_type": "PrimitiveNode" // Text Select
      },

      // 7: Master Selector - Lighting
      "7": {
        "inputs": {
          "text": masterToggles.lighting ? (masterSelector.lighting || "original") : "original",
          "multiline": false
        },
        "class_type": "PrimitiveNode" // Text Select
      },

      // 8: Master Selector - Decor Style
      "8": {
        "inputs": {
          "text": masterToggles.decor ? (masterSelector.decorStyle || "original") : "original",
          "multiline": false
        },
        "class_type": "PrimitiveNode" // Text Select
      },

      // 9: Boolean Switch - Walls
      "9": {
        "inputs": {
          "boolean": masterToggles.walls
        },
        "class_type": "PrimitiveNode" // Boolean
      },

      // 10: Boolean Switch - Ceiling
      "10": {
        "inputs": {
          "boolean": masterToggles.ceiling
        },
        "class_type": "PrimitiveNode" // Boolean
      },

      // 11: Boolean Switch - Furniture
      "11": {
        "inputs": {
          "boolean": masterToggles.furniture
        },
        "class_type": "PrimitiveNode" // Boolean
      },

      // 12: Boolean Switch - Floor
      "12": {
        "inputs": {
          "boolean": masterToggles.floor
        },
        "class_type": "PrimitiveNode" // Boolean
      },

      // 13: Boolean Switch - Lighting
      "13": {
        "inputs": {
          "boolean": masterToggles.lighting
        },
        "class_type": "PrimitiveNode" // Boolean
      },

      // 14: Boolean Switch - Decor
      "14": {
        "inputs": {
          "boolean": masterToggles.decor
        },
        "class_type": "PrimitiveNode" // Boolean
      },

      // 15: Master Prompt Builder - String Concatenate
      "15": {
        "inputs": {
          "string_a": "A photorealistic interior of a " + request.roomType + " with",
          "string_b": masterToggles.walls ? masterSelector.wallColor + " walls" : "original walls",
          "string_c": masterToggles.ceiling ? "a " + masterSelector.ceiling + " ceiling" : "original ceiling",
          "string_d": masterToggles.furniture ? "and " + masterSelector.furnitureStyle + " furniture" : "and original furniture",
          "string_e": masterToggles.floor ? "on " + masterSelector.floorType + " flooring" : "on original flooring",
          "string_f": masterToggles.lighting ? "with " + masterSelector.lighting + " lighting" : "with original lighting",
          "string_g": masterToggles.decor ? "in " + masterSelector.decorStyle + " style" : "in original style",
          "concatenation": " + "
        },
        "class_type": "StringConcatenate" // WAS Node Suite
      },

      // 16: Positive Prompt CLIP
      "16": {
        "inputs": {
          "text": "professional interior photography, high resolution, detailed, realistic, architectural digest quality",
          "clip": ["1", 1]
        },
        "class_type": "CLIPTextEncode"
      },

      // 17: Enhanced Positive Prompt (with Master Builder)
      "17": {
        "inputs": {
          "text": ["15", 0], // Output from String Concatenate
          "clip": ["1", 1]
        },
        "class_type": "CLIPTextEncode"
      },

      // 18: Negative Prompt
      "18": {
        "inputs": {
          "text": "blurry, low quality, distorted, watermark, text, cartoon, anime, unrealistic, bad architecture",
          "clip": ["1", 1]
        },
        "class_type": "CLIPTextEncode"
      },

      // 19: KSampler
      "19": {
        "inputs": {
          "seed": Math.floor(Math.random() * 2147483647),
          "steps": request.settings?.num_inference_steps || 25,
          "cfg": request.settings?.guidance_scale || 7,
          "sampler_name": "dpmpp_2m",
          "scheduler": "karras",
          "denoise": 0.8,
          "model": ["1", 0],
          "positive": ["17", 0],
          "negative": ["18", 0],
          "latent_image": ["20", 0]
        },
        "class_type": "KSampler"
      },

      // 20: Empty Latent Image
      "20": {
        "inputs": {
          "width": 1024,
          "height": 1024,
          "batch_size": 1
        },
        "class_type": "EmptyLatentImage"
      },

      // 21: VAE Decode
      "21": {
        "inputs": {
          "samples": ["19", 0],
          "vae": ["2", 0]
        },
        "class_type": "VAEDecode"
      },

      // 22: Save Image
      "22": {
        "inputs": {
          "filename_prefix": `master-selector-${request.mode}-${Date.now()}`,
          "images": ["21", 0]
        },
        "class_type": "SaveImage"
      }
    }
  };
}

export function createArchAi3dWorkflow(request: MasterGenerationRequest) {
  const { masterSelector, masterToggles, generationMode } = request;

  // ArchAi3d-Qwen Room Transform Prompt Builder Workflow
  return {
    "prompt": {
      // 1: Load Checkpoint
      "1": {
        "inputs": {
          "ckpt_name": "sd_xl_base_1.0.safetensors"
        },
        "class_type": "CheckpointLoaderSimple"
      },

      // 2: ArchAi3d Room Transform Prompt Builder
      "2": {
        "inputs": {
          "mode": generationMode, // 'selective', 'complete', or 'remove_paint'
          "room_type": request.roomType,
          // Material selections from 103+ presets
          "wall_material": masterToggles.walls ? masterSelector.wallColor : "keep_original",
          "ceiling_material": masterToggles.ceiling ? masterSelector.ceiling : "keep_original",
          "floor_material": masterToggles.floor ? (masterSelector.floorType || "keep_original") : "keep_original",
          "furniture_style": masterToggles.furniture ? masterSelector.furnitureStyle : "keep_original",
          "lighting_style": masterToggles.lighting ? (masterSelector.lighting || "keep_original") : "keep_original",
          "decor_style": masterToggles.decor ? (masterSelector.decorStyle || "keep_original") : "keep_original",
          // Advanced options
          "quality_level": "ultra_high",
          "architectural_accuracy": "high",
          "material_realism": "photorealistic",
          "lighting_quality": "professional"
        },
        "class_type": "ArchAi3dRoomTransformPromptBuilder"
      },

      // 3: Positive Prompt (from ArchAi3d)
      "3": {
        "inputs": {
          "text": ["2", 0], // Output from ArchAi3d Prompt Builder
          "clip": ["1", 1]
        },
        "class_type": "CLIPTextEncode"
      },

      // 4: Negative Prompt
      "4": {
        "inputs": {
          "text": "blurry, low quality, distorted, watermark, text, cartoon, anime, unrealistic, bad architecture, poor materials",
          "clip": ["1", 1]
        },
        "class_type": "CLIPTextEncode"
      },

      // 5: KSampler
      "5": {
        "inputs": {
          "seed": Math.floor(Math.random() * 2147483647),
          "steps": request.settings?.num_inference_steps || 30,
          "cfg": request.settings?.guidance_scale || 8,
          "sampler_name": "dpmpp_2m",
          "scheduler": "karras",
          "denoise": 0.85,
          "model": ["1", 0],
          "positive": ["3", 0],
          "negative": ["4", 0],
          "latent_image": ["6", 0]
        },
        "class_type": "KSampler"
      },

      // 6: Empty Latent Image
      "6": {
        "inputs": {
          "width": 1024,
          "height": 1024,
          "batch_size": 1
        },
        "class_type": "EmptyLatentImage"
      },

      // 7: VAE Decode
      "7": {
        "inputs": {
          "samples": ["5", 0],
          "vae": ["1", 2]
        },
        "class_type": "VAEDecode"
      },

      // 8: Save Image
      "8": {
        "inputs": {
          "filename_prefix": `archai3d-${generationMode}-${Date.now()}`,
          "images": ["7", 0]
        },
        "class_type": "SaveImage"
      }
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Stage 1: Scene Understanding — GroundingDINO + SAM2 + DepthAnythingV2
// ═══════════════════════════════════════════════════════════════════════════════
//
// ARCHITECTURE OVERVIEW (36 nodes total):
// ┌──────────────────────────────────────────────────────────────────────────┐
// │  LoadImage ─┬─→ GroundingDINO+SAM2 Pass 1 (furniture) ──┐             │
// │             ├─→ GroundingDINO+SAM2 Pass 2 (secondary) ──┤ OR → obj    │
// │             ├─→ GroundingDINO+SAM2 Pass 3 (walls)    ──→│ wall        │
// │             ├─→ GroundingDINO+SAM2 Pass 4 (floor)    ──→│ floor       │
// │             ├─→ GroundingDINO+SAM2 Pass 5 (ceiling)  ──→│ ceiling     │
// │             └─→ DepthAnythingV2 ─────────────────────→ depth_map      │
// │                                                                        │
// │  Subtraction Chain:                                                    │
// │    wall_clean    = wall − (floor + objects)                            │
// │    floor_clean   = floor − objects                                     │
// │    ceiling_clean = ceiling − objects                                   │
// │    empty_space   = floor_clean − objects                              │
// │                                                                        │
// │  Post-Process: GrowMaskWithBlur → MaskToImage → SaveImage             │
// └──────────────────────────────────────────────────────────────────────────┘
//
// VRAM Budget (RTX 4060 8GB):
//   GroundingDINO SwinT:  ~694MB
//   SAM2 hiera_small:     ~150MB
//   DepthAnythingV2 ViTS: ~100MB
//   Peak (sequential):    ~900MB — safe headroom for 8GB
//
// All class_type names verified against installed custom nodes:
//   ComfyUI-SAM2/node.py:
//     - "GroundingDinoModelLoader (segment anything2)"
//     - "SAM2ModelLoader (segment anything2)"
//     - "GroundingDinoSAM2Segment (segment anything2)"  → returns (IMAGE, MASK)
//   comfyui_controlnet_aux:
//     - "DepthAnythingV2Preprocessor"
//   ComfyUI core:
//     - "LoadImage", "MaskComposite", "ThresholdMask", "MaskToImage", "SaveImage"
//   ComfyUI-KJNodes:
//     - "GrowMaskWithBlur"
// ═══════════════════════════════════════════════════════════════════════════════

export type IndianRoomType =
  | 'living_room' | 'bedroom' | 'kitchen' | 'dining_room'
  | 'bathroom' | 'pooja_room' | 'balcony' | 'office'
  | 'cluttered' | 'general';

export interface SceneUnderstandingConfig {
  imageFilename: string;
  roomType?: IndianRoomType;
}

// ── GroundingDINO Prompt Sets (period-separated for multi-object detection) ──
// GroundingDINO uses "." as the separator between object classes.
// Each prompt set is tuned for Indian interior challenges.

interface DINOPromptSet {
  furniture: string;      // Major furniture items
  secondary: string;      // Clutter, decor, electronics, traditional items
  wall: string;           // Wall surfaces (DINO detects exposed wall patches)
  floor: string;          // Floor surfaces
  ceiling: string;        // Ceiling surfaces
  furnitureTh: number;    // Detection threshold for furniture
  secondaryTh: number;    // Detection threshold for secondary items
  wallTh: number;
  floorTh: number;
  ceilingTh: number;
}

const DINO_PROMPTS: Record<string, DINOPromptSet> = {
  general: {
    furniture: 'sofa . table . chair . bed . cabinet . shelf . wardrobe . desk . dresser . stool',
    secondary: 'lamp . ceiling fan . curtain . rug . carpet . plant . television . mirror . decoration . air conditioner . clock . picture frame',
    wall: 'wall . painted wall . interior wall . room wall . wallpaper',
    floor: 'floor . tile floor . wooden floor . marble floor . carpet floor . flooring',
    ceiling: 'ceiling . room ceiling . false ceiling . overhead surface',
    furnitureTh: 0.28, secondaryTh: 0.22, wallTh: 0.30, floorTh: 0.30, ceilingTh: 0.32,
  },
  living_room: {
    furniture: 'sofa . couch . sofa set . center table . coffee table . TV unit . entertainment unit . recliner . armchair . display cabinet . bookshelf . side table . shoe rack',
    secondary: 'ceiling fan . table lamp . floor lamp . curtain . rug . carpet . plant . television . air conditioner . wall clock . speaker . photo frame . idol . vase . cushion . remote . decorative item',
    wall: 'wall . living room wall . accent wall . painted wall . textured wall . wallpaper . wall with frames',
    floor: 'floor . marble floor . vitrified tile . stone floor . carpet . polished floor . rangoli',
    ceiling: 'ceiling . false ceiling . POP ceiling . ceiling with lights . decorative ceiling',
    furnitureTh: 0.25, secondaryTh: 0.20, wallTh: 0.28, floorTh: 0.28, ceilingTh: 0.30,
  },
  bedroom: {
    furniture: 'bed . bed frame . headboard . nightstand . bedside table . wardrobe . closet . dresser . dressing table . vanity mirror . study desk . chair . chest of drawers . almirah',
    secondary: 'ceiling fan . table lamp . bedside lamp . curtain . rug . air conditioner . mirror . wall decor . photo frame . clock . plant . pillow . cushion . blanket',
    wall: 'wall . bedroom wall . headboard wall . accent wall . wallpaper . textured wall',
    floor: 'floor . bedroom floor . marble floor . tile floor . wooden floor . carpet',
    ceiling: 'ceiling . bedroom ceiling . false ceiling . ceiling with fan',
    furnitureTh: 0.25, secondaryTh: 0.22, wallTh: 0.28, floorTh: 0.28, ceilingTh: 0.30,
  },
  kitchen: {
    furniture: 'kitchen cabinet . upper cabinet . lower cabinet . counter . countertop . kitchen island . dining table . dining chair . storage rack . refrigerator . microwave stand . dish rack',
    secondary: 'chimney . exhaust fan . light fixture . gas stove . microwave . mixer grinder . water purifier . spice rack . utensil holder . plant . pressure cooker . steel container',
    wall: 'wall . kitchen wall . tiled wall . backsplash . wall above counter . wall between cabinets',
    floor: 'floor . kitchen floor . tile floor . anti-skid floor . stone floor',
    ceiling: 'ceiling . kitchen ceiling . ceiling above counter',
    furnitureTh: 0.25, secondaryTh: 0.20, wallTh: 0.30, floorTh: 0.28, ceilingTh: 0.32,
  },
  dining_room: {
    furniture: 'dining table . dining chair . sideboard . buffet table . display cabinet . crockery cabinet . bar unit . serving trolley . dining bench',
    secondary: 'chandelier . pendant light . curtain . rug . plant . wall art . mirror . clock . vase . flower arrangement . candle holder . table runner',
    wall: 'wall . dining room wall . accent wall . wall with artwork . textured wall',
    floor: 'floor . dining room floor . marble floor . tile floor . wooden floor',
    ceiling: 'ceiling . dining room ceiling . ceiling with chandelier . decorative ceiling',
    furnitureTh: 0.25, secondaryTh: 0.22, wallTh: 0.28, floorTh: 0.28, ceilingTh: 0.30,
  },
  bathroom: {
    furniture: 'toilet . bathtub . shower enclosure . vanity . sink . wash basin . cabinet . mirror cabinet . towel rack . washing machine . geyser',
    secondary: 'mirror . shower head . faucet . towel . light fixture . exhaust fan . water heater . soap dispenser . bucket . mug',
    wall: 'wall . bathroom wall . tiled wall . shower wall . ceramic wall',
    floor: 'floor . bathroom floor . wet area floor . anti-skid tiles . shower floor',
    ceiling: 'ceiling . bathroom ceiling . false ceiling',
    furnitureTh: 0.28, secondaryTh: 0.24, wallTh: 0.30, floorTh: 0.30, ceilingTh: 0.32,
  },
  pooja_room: {
    furniture: 'temple . mandir . pooja shelf . wooden temple . marble temple . cabinet . storage unit . pooja stand . altar',
    secondary: 'idol . statue . brass item . diya . oil lamp . bell . incense holder . agarbatti stand . flower vase . garland . picture frame . light fixture . kalash . puja thali . conch shell',
    wall: 'wall . pooja room wall . decorated wall . marble wall . wall behind temple',
    floor: 'floor . pooja room floor . marble floor . clean floor . floor near temple',
    ceiling: 'ceiling . pooja room ceiling . decorated ceiling',
    furnitureTh: 0.22, secondaryTh: 0.18, wallTh: 0.28, floorTh: 0.28, ceilingTh: 0.32,
  },
  balcony: {
    furniture: 'chair . table . swing . jhula . railing . planter box . bench . small table . outdoor sofa',
    secondary: 'plant . potted plant . hanging plant . light . lamp . curtain . wind chime . bird cage . clothes drying rack',
    wall: 'wall . balcony wall . exterior wall . railing wall . parapet',
    floor: 'floor . balcony floor . tile floor . stone floor . outdoor floor',
    ceiling: 'ceiling . balcony ceiling . roof slab . overhead cover',
    furnitureTh: 0.25, secondaryTh: 0.20, wallTh: 0.28, floorTh: 0.28, ceilingTh: 0.30,
  },
  office: {
    furniture: 'desk . office chair . bookshelf . filing cabinet . study table . shelving unit . computer table . ergonomic chair',
    secondary: 'lamp . computer . monitor . laptop . curtain . blind . plant . books . clock . artwork . printer . whiteboard',
    wall: 'wall . office wall . study wall . painted wall',
    floor: 'floor . office floor . wooden floor . carpet floor . tile floor',
    ceiling: 'ceiling . office ceiling . false ceiling',
    furnitureTh: 0.25, secondaryTh: 0.22, wallTh: 0.28, floorTh: 0.28, ceilingTh: 0.30,
  },
  cluttered: {
    furniture: 'sofa . table . chair . bed . cabinet . shelf . wardrobe . desk . stool . trunk . box . chest . rack . almirah',
    secondary: 'lamp . fan . curtain . rug . plant . television . mirror . decoration . bag . books . toys . basket . container . appliance . idol . clock . air conditioner . bucket . steel container . pressure cooker',
    wall: 'wall . visible wall . wall behind furniture . wall gap . exposed wall surface',
    floor: 'floor . visible floor . floor between furniture . floor gap . tile floor',
    ceiling: 'ceiling . room ceiling . overhead surface',
    furnitureTh: 0.22, secondaryTh: 0.18, wallTh: 0.25, floorTh: 0.25, ceilingTh: 0.30,
  },
};

/**
 * Create the Stage 1 Scene Understanding workflow.
 *
 * PRIMARY pipeline: GroundingDINO + SAM2 for ALL masks (walls, floors, ceiling, objects).
 * SECONDARY: DepthAnythingV2 for depth map.
 *
 * This is a pure GroundingDINO+SAM2 approach — NO CLIPSeg dependency.
 * GroundingDINO provides semantic object detection, SAM2 provides pixel-precise masks.
 *
 * @param imageFilename - filename already uploaded to ComfyUI/input/
 * @param roomType - Indian room type for optimized prompts
 * @returns ComfyUI API-format workflow JSON (flat { nodeId: { class_type, inputs } })
 */
export function createSceneUnderstandingWorkflow(
  imageFilename: string,
  roomType: IndianRoomType = 'general'
): Record<string, { class_type: string; inputs: Record<string, any> }> {
  const prompts = DINO_PROMPTS[roomType] || DINO_PROMPTS.general;

  const w: Record<string, { class_type: string; inputs: Record<string, any> }> = {};

  // ╔═══════════════════════════════════════════════════════════════════════════╗
  // ║  NODE 1: Load Image                                                      ║
  // ║  Input: User's room photo (already in ComfyUI/input/)                   ║
  // ║  Output slot 0: IMAGE tensor                                            ║
  // ╚═══════════════════════════════════════════════════════════════════════════╝
  w['1'] = {
    class_type: 'LoadImage',
    inputs: { image: imageFilename, upload: 'image' },
  };

  // ╔═══════════════════════════════════════════════════════════════════════════╗
  // ║  NODES 2-3: Model Loading (GroundingDINO + SAM2)                        ║
  // ║  These are loaded ONCE and shared across all 5 detection passes.        ║
  // ║  SwinT variant (694MB) chosen for 8GB VRAM safety.                      ║
  // ║  sam2_hiera_small (~150MB) for fast inference with excellent edges.      ║
  // ╚═══════════════════════════════════════════════════════════════════════════╝
  w['2'] = {
    class_type: 'GroundingDinoModelLoader (segment anything2)',
    inputs: { model_name: 'GroundingDINO_SwinT_OGC (694MB)' },
  };
  w['3'] = {
    class_type: 'SAM2ModelLoader (segment anything2)',
    inputs: { model_name: 'sam2_hiera_small.pt' },
  };

  // ╔═══════════════════════════════════════════════════════════════════════════╗
  // ║  NODES 10-14: Five GroundingDINO+SAM2 Segmentation Passes               ║
  // ║                                                                          ║
  // ║  Each pass detects a semantic category and produces pixel-precise masks. ║
  // ║  GroundingDINO finds bounding boxes → SAM2 refines to pixel masks.      ║
  // ║  Output: slot 0 = IMAGE (masked), slot 1 = MASK (binary)                ║
  // ║                                                                          ║
  // ║  keep_model_loaded=true on passes 1-4 to avoid reload overhead.         ║
  // ║  keep_model_loaded=false on pass 5 to free VRAM for DepthAnythingV2.    ║
  // ╚═══════════════════════════════════════════════════════════════════════════╝

  // Pass 1: Furniture (major objects)
  w['10'] = {
    class_type: 'GroundingDinoSAM2Segment (segment anything2)',
    inputs: {
      sam_model: ['3', 0], grounding_dino_model: ['2', 0], image: ['1', 0],
      prompt: prompts.furniture, threshold: prompts.furnitureTh,
      keep_model_loaded: true,
    },
  };

  // Pass 2: Secondary/Clutter (fans, lamps, decor, traditional items)
  w['11'] = {
    class_type: 'GroundingDinoSAM2Segment (segment anything2)',
    inputs: {
      sam_model: ['3', 0], grounding_dino_model: ['2', 0], image: ['1', 0],
      prompt: prompts.secondary, threshold: prompts.secondaryTh,
      keep_model_loaded: true,
    },
  };

  // Pass 3: Walls
  w['12'] = {
    class_type: 'GroundingDinoSAM2Segment (segment anything2)',
    inputs: {
      sam_model: ['3', 0], grounding_dino_model: ['2', 0], image: ['1', 0],
      prompt: prompts.wall, threshold: prompts.wallTh,
      keep_model_loaded: true,
    },
  };

  // Pass 4: Floor
  w['13'] = {
    class_type: 'GroundingDinoSAM2Segment (segment anything2)',
    inputs: {
      sam_model: ['3', 0], grounding_dino_model: ['2', 0], image: ['1', 0],
      prompt: prompts.floor, threshold: prompts.floorTh,
      keep_model_loaded: true,
    },
  };

  // Pass 5: Ceiling (last pass — unloads models)
  w['14'] = {
    class_type: 'GroundingDinoSAM2Segment (segment anything2)',
    inputs: {
      sam_model: ['3', 0], grounding_dino_model: ['2', 0], image: ['1', 0],
      prompt: prompts.ceiling, threshold: prompts.ceilingTh,
      keep_model_loaded: false,  // ← Frees ~850MB VRAM after this pass
    },
  };

  // ╔═══════════════════════════════════════════════════════════════════════════╗
  // ║  NODE 15: Depth Map (DepthAnythingV2)                                   ║
  // ║  Runs AFTER SAM2 models are unloaded (sequential VRAM safety).          ║
  // ║  resolution: 1024 — DO NOT increase on 8GB cards.                       ║
  // ╚═══════════════════════════════════════════════════════════════════════════╝
  w['15'] = {
    class_type: 'DepthAnythingV2Preprocessor',
    inputs: { image: ['1', 0], ckpt_name: 'depth_anything_v2_vits.pth', resolution: 1024 },
  };

  // ╔═══════════════════════════════════════════════════════════════════════════╗
  // ║  NODE 20: Combine Objects (furniture OR secondary)                       ║
  // ║  Merges all detected objects into a single unified object mask.         ║
  // ║  Uses slot 1 (MASK) from GroundingDinoSAM2Segment.                     ║
  // ╚═══════════════════════════════════════════════════════════════════════════╝
  w['20'] = {
    class_type: 'MaskComposite',
    inputs: { destination: ['10', 1], source: ['11', 1], x: 0, y: 0, operation: 'or' },
  };

  // ╔═══════════════════════════════════════════════════════════════════════════╗
  // ║  NODES 21-23: Subtraction Chain (The Core Logic)                        ║
  // ║                                                                          ║
  // ║  21: wall_clean = wall − floor − objects                                ║
  // ║      Prevents floor reflections and furniture from bleeding into walls. ║
  // ║  22: floor_clean = floor − objects                                      ║
  // ║      Removes furniture footprints from the floor mask.                  ║
  // ║  23: ceiling_clean = ceiling − objects                                  ║
  // ║      Removes fans/lights from the ceiling mask.                         ║
  // ╚═══════════════════════════════════════════════════════════════════════════╝

  // Wall − Floor
  w['21a'] = {
    class_type: 'MaskComposite',
    inputs: { destination: ['12', 1], source: ['13', 1], x: 0, y: 0, operation: 'subtract' },
  };
  // (Wall − Floor) − Objects = clean wall
  w['21'] = {
    class_type: 'MaskComposite',
    inputs: { destination: ['21a', 0], source: ['20', 0], x: 0, y: 0, operation: 'subtract' },
  };

  // Floor − Objects = clean floor
  w['22'] = {
    class_type: 'MaskComposite',
    inputs: { destination: ['13', 1], source: ['20', 0], x: 0, y: 0, operation: 'subtract' },
  };

  // Ceiling − Objects = clean ceiling
  w['23'] = {
    class_type: 'MaskComposite',
    inputs: { destination: ['14', 1], source: ['20', 0], x: 0, y: 0, operation: 'subtract' },
  };

  // ╔═══════════════════════════════════════════════════════════════════════════╗
  // ║  NODES 30-33: GrowMaskWithBlur Post-Processing                          ║
  // ║                                                                          ║
  // ║  30: Wall — expand:6, blur:4, fill_holes:true                           ║
  // ║      Aggressive hole-filling for gaps behind furniture / between tiles. ║
  // ║  31: Floor — expand:3, blur:2, fill_holes:true                          ║
  // ║      Moderate smoothing, fills under-furniture gaps.                    ║
  // ║  32: Objects — expand:3, blur:2, fill_holes:false                       ║
  // ║      Gentle smoothing. NO fill_holes to preserve object boundaries.    ║
  // ║  33: Ceiling — expand:2, blur:2, fill_holes:true                        ║
  // ║      Light fill for gaps around fan/light cutouts.                      ║
  // ╚═══════════════════════════════════════════════════════════════════════════╝
  w['30'] = {
    class_type: 'GrowMaskWithBlur',
    inputs: {
      mask: ['21', 0], expand: 6, incremental_expandrate: 0.0,
      tapered_corners: true, flip_input: false,
      blur_radius: 4.0, lerp_alpha: 1.0, decay_factor: 1.0, fill_holes: true,
    },
  };
  w['31'] = {
    class_type: 'GrowMaskWithBlur',
    inputs: {
      mask: ['22', 0], expand: 3, incremental_expandrate: 0.0,
      tapered_corners: true, flip_input: false,
      blur_radius: 2.0, lerp_alpha: 1.0, decay_factor: 1.0, fill_holes: true,
    },
  };
  w['32'] = {
    class_type: 'GrowMaskWithBlur',
    inputs: {
      mask: ['20', 0], expand: 3, incremental_expandrate: 0.0,
      tapered_corners: true, flip_input: false,
      blur_radius: 2.0, lerp_alpha: 1.0, decay_factor: 1.0, fill_holes: false,
    },
  };
  w['33'] = {
    class_type: 'GrowMaskWithBlur',
    inputs: {
      mask: ['23', 0], expand: 2, incremental_expandrate: 0.0,
      tapered_corners: true, flip_input: false,
      blur_radius: 2.0, lerp_alpha: 1.0, decay_factor: 1.0, fill_holes: true,
    },
  };

  // ╔═══════════════════════════════════════════════════════════════════════════╗
  // ║  NODE 34: Empty Space = Refined Floor − Refined Objects                  ║
  // ║  This mask represents safe zones for placing new furniture in Stage 4.  ║
  // ╚═══════════════════════════════════════════════════════════════════════════╝
  w['34'] = {
    class_type: 'MaskComposite',
    inputs: { destination: ['31', 0], source: ['32', 0], x: 0, y: 0, operation: 'subtract' },
  };

  // ╔═══════════════════════════════════════════════════════════════════════════╗
  // ║  NODES 40-44: MaskToImage Conversions                                   ║
  // ║  Required because SaveImage expects IMAGE tensors, not MASK tensors.   ║
  // ╚═══════════════════════════════════════════════════════════════════════════╝
  w['40'] = { class_type: 'MaskToImage', inputs: { mask: ['30', 0] } };  // wall
  w['41'] = { class_type: 'MaskToImage', inputs: { mask: ['31', 0] } };  // floor
  w['42'] = { class_type: 'MaskToImage', inputs: { mask: ['32', 0] } };  // objects
  w['43'] = { class_type: 'MaskToImage', inputs: { mask: ['33', 0] } };  // ceiling
  w['44'] = { class_type: 'MaskToImage', inputs: { mask: ['34', 0] } };  // empty space

  // ╔═══════════════════════════════════════════════════════════════════════════╗
  // ║  NODES 50-55: SaveImage Outputs                                         ║
  // ║  filename_prefix must match what _extractFilenames() expects:           ║
  // ║    'stage1/wall_mask'  → key: 'wall_mask'                              ║
  // ║    'stage1/floor_mask' → key: 'floor_mask'                             ║
  // ║    'stage1/object_mask' → key: 'object_mask'                           ║
  // ║    'stage1/ceiling_mask' → key: 'ceiling_mask'                         ║
  // ║    'stage1/empty_mask' → key: 'empty_mask'                             ║
  // ║    'stage1/depth_map'  → key: 'depth_map'                              ║
  // ╚═══════════════════════════════════════════════════════════════════════════╝
  w['50'] = { class_type: 'SaveImage', inputs: { images: ['40', 0], filename_prefix: 'stage1/wall_mask' } };
  w['51'] = { class_type: 'SaveImage', inputs: { images: ['41', 0], filename_prefix: 'stage1/floor_mask' } };
  w['52'] = { class_type: 'SaveImage', inputs: { images: ['42', 0], filename_prefix: 'stage1/object_mask' } };
  w['53'] = { class_type: 'SaveImage', inputs: { images: ['43', 0], filename_prefix: 'stage1/ceiling_mask' } };
  w['54'] = { class_type: 'SaveImage', inputs: { images: ['44', 0], filename_prefix: 'stage1/empty_mask' } };
  w['55'] = { class_type: 'SaveImage', inputs: { images: ['15', 0], filename_prefix: 'stage1/depth_map' } };

  return w;
}

// ═══════════════════════════════════════════════════════════════════════════════
// STABLE Scene Understanding — GroundingDINO + SAM2 + DepthAnythingV2
// ═══════════════════════════════════════════════════════════════════════════════
//
// A clean, reliable, production-grade Stage 1 pipeline.
// Accepts base64 image, writes to ComfyUI/input/, returns full workflow JSON.
//
// Outputs: wall_mask, floor_mask, ceiling_mask, object_mask, empty_mask, depth_map
// Peak VRAM: ~900MB (safe for RTX 4060 8GB)
//
// Node Map (36 nodes total):
//   1       LoadImage
//   2-3     GroundingDINO + SAM2 model loaders (shared)
//   10-14   Five segmentation passes (furniture, secondary, wall, floor, ceiling)
//   15      DepthAnythingV2 (runs after models unloaded)
//   20      MaskComposite OR (furniture + secondary → object_mask)
//   21a,21  Subtraction: wall − floor − objects
//   22      Subtraction: floor − objects
//   23      Subtraction: ceiling − objects
//   30-33   GrowMaskWithBlur post-processing
//   34      Empty space = refined floor − refined objects
//   40-44   MaskToImage conversions
//   50-55   SaveImage outputs
// ═══════════════════════════════════════════════════════════════════════════════

/** Room-type-specific GroundingDINO prompt configuration */
interface StableDINOPrompts {
  furniture: string;
  secondary: string;
  wall: string;
  floor: string;
  ceiling: string;
  furnitureTh: number;
  secondaryTh: number;
  wallTh: number;
  floorTh: number;
  ceilingTh: number;
}

const STABLE_DINO_PROMPTS: Record<string, StableDINOPrompts> = {
  general: {
    furniture: 'sofa . table . chair . bed . cabinet . shelf . wardrobe . desk . dresser . stool',
    secondary: 'lamp . ceiling fan . curtain . rug . carpet . plant . television . mirror . decoration . air conditioner . clock . picture frame',
    wall: 'wall . painted wall . interior wall . room wall . wallpaper',
    floor: 'floor . tile floor . wooden floor . marble floor . carpet floor . flooring',
    ceiling: 'ceiling . room ceiling . false ceiling . overhead surface',
    furnitureTh: 0.28, secondaryTh: 0.22, wallTh: 0.30, floorTh: 0.30, ceilingTh: 0.32,
  },
  living_room: {
    furniture: 'sofa . couch . sofa set . center table . coffee table . TV unit . entertainment unit . recliner . armchair . display cabinet . bookshelf . side table . shoe rack',
    secondary: 'ceiling fan . table lamp . floor lamp . curtain . rug . carpet . plant . television . air conditioner . wall clock . speaker . photo frame . idol . vase . cushion',
    wall: 'wall . living room wall . accent wall . painted wall . textured wall . wallpaper',
    floor: 'floor . marble floor . vitrified tile . stone floor . carpet . polished floor',
    ceiling: 'ceiling . false ceiling . POP ceiling . ceiling with lights . decorative ceiling',
    furnitureTh: 0.25, secondaryTh: 0.20, wallTh: 0.28, floorTh: 0.28, ceilingTh: 0.30,
  },
  bedroom: {
    furniture: 'bed . bed frame . headboard . nightstand . bedside table . wardrobe . closet . dresser . dressing table . vanity mirror . study desk . chair . chest of drawers . almirah',
    secondary: 'ceiling fan . table lamp . bedside lamp . curtain . rug . air conditioner . mirror . wall decor . photo frame . clock . plant . pillow . cushion . blanket',
    wall: 'wall . bedroom wall . headboard wall . accent wall . wallpaper . textured wall',
    floor: 'floor . bedroom floor . marble floor . tile floor . wooden floor . carpet',
    ceiling: 'ceiling . bedroom ceiling . false ceiling . ceiling with fan',
    furnitureTh: 0.25, secondaryTh: 0.22, wallTh: 0.28, floorTh: 0.28, ceilingTh: 0.30,
  },
  kitchen: {
    furniture: 'kitchen cabinet . upper cabinet . lower cabinet . counter . countertop . kitchen island . dining table . dining chair . storage rack . refrigerator . microwave stand . dish rack',
    secondary: 'chimney . exhaust fan . light fixture . gas stove . microwave . mixer grinder . water purifier . spice rack . utensil holder . plant . pressure cooker . steel container',
    wall: 'wall . kitchen wall . tiled wall . backsplash . wall above counter',
    floor: 'floor . kitchen floor . tile floor . anti-skid floor . stone floor',
    ceiling: 'ceiling . kitchen ceiling . ceiling above counter',
    furnitureTh: 0.25, secondaryTh: 0.20, wallTh: 0.30, floorTh: 0.28, ceilingTh: 0.32,
  },
  pooja_room: {
    furniture: 'temple . mandir . pooja shelf . wooden temple . marble temple . cabinet . storage unit . pooja stand . altar',
    secondary: 'idol . statue . brass item . diya . oil lamp . bell . incense holder . agarbatti stand . flower vase . garland . picture frame . light fixture . kalash . puja thali',
    wall: 'wall . pooja room wall . decorated wall . marble wall . wall behind temple',
    floor: 'floor . pooja room floor . marble floor . clean floor . floor near temple',
    ceiling: 'ceiling . pooja room ceiling . decorated ceiling',
    furnitureTh: 0.22, secondaryTh: 0.18, wallTh: 0.28, floorTh: 0.28, ceilingTh: 0.32,
  },
  cluttered: {
    furniture: 'sofa . table . chair . bed . cabinet . shelf . wardrobe . desk . stool . trunk . box . chest . rack . almirah',
    secondary: 'lamp . fan . curtain . rug . plant . television . mirror . decoration . bag . books . toys . basket . container . appliance . idol . clock . air conditioner',
    wall: 'wall . visible wall . wall behind furniture . wall gap . exposed wall surface',
    floor: 'floor . visible floor . floor between furniture . floor gap . tile floor',
    ceiling: 'ceiling . room ceiling . overhead surface',
    furnitureTh: 0.22, secondaryTh: 0.18, wallTh: 0.25, floorTh: 0.25, ceilingTh: 0.30,
  },
};

/** Result from createStableSceneUnderstandingWorkflow */
export interface StableSceneWorkflowResult {
  /** ComfyUI API-format workflow (flat node map) — pass to POST /prompt as { prompt: workflow } */
  workflow: Record<string, { class_type: string; inputs: Record<string, any> }>;
  /** Filename written to ComfyUI/input/ */
  uploadedFilename: string;
}

/**
 * Create a stable, production-ready Stage 1 Scene Understanding workflow.
 *
 * Pure GroundingDINO+SAM2 pipeline (no CLIPSeg dependency).
 * Generates 6 outputs: wall_mask, floor_mask, ceiling_mask, object_mask, empty_mask, depth_map.
 *
 * VRAM budget: ~900MB peak (safe for RTX 4060 8GB).
 *
 * @param imageBase64 - Base64-encoded image (with or without data:image/ prefix)
 * @param roomType - Indian room type for optimized GroundingDINO prompts (default: 'general')
 * @returns Workflow JSON + uploaded filename
 */
export function createStableSceneUnderstandingWorkflow(
  imageBase64: string,
  roomType: string = 'general',
): StableSceneWorkflowResult {
  // ── Step 1: Decode base64 → write to ComfyUI/input/ ──────────────────────
  const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
  const imageBuffer = Buffer.from(cleanBase64, 'base64');
  const filename = `stable_scene_${Date.now()}.png`;
  const comfyInputDir = process.env.COMFY_INPUT || '/home/nikhil/Documents/Remo2/ComfyUI/input';

  if (!fs.existsSync(comfyInputDir)) {
    fs.mkdirSync(comfyInputDir, { recursive: true });
  }
  fs.writeFileSync(path.join(comfyInputDir, filename), imageBuffer);

  // ── Step 2: Build workflow ────────────────────────────────────────────────
  const prompts = STABLE_DINO_PROMPTS[roomType] || STABLE_DINO_PROMPTS.general;
  const w: Record<string, { class_type: string; inputs: Record<string, any> }> = {};

  // ── Node 1: Load Image ────────────────────────────────────────────────────
  w['1'] = {
    class_type: 'LoadImage',
    inputs: { image: filename, upload: 'image' },
  };

  // ── Nodes 2-3: Model Loading (shared across all passes) ───────────────────
  w['2'] = {
    class_type: 'GroundingDinoModelLoader (segment anything2)',
    inputs: { model_name: 'GroundingDINO_SwinT_OGC (694MB)' },
  };
  w['3'] = {
    class_type: 'SAM2ModelLoader (segment anything2)',
    inputs: { model_name: 'sam2_hiera_small.pt' },
  };

  // ── Nodes 10-14: Five GroundingDINO+SAM2 Passes ──────────────────────────
  // Output: slot 0 = IMAGE (visualization), slot 1 = MASK (binary)
  w['10'] = {
    class_type: 'GroundingDinoSAM2Segment (segment anything2)',
    inputs: {
      sam_model: ['3', 0], grounding_dino_model: ['2', 0], image: ['1', 0],
      prompt: prompts.furniture, threshold: prompts.furnitureTh,
      keep_model_loaded: true,
    },
  };
  w['11'] = {
    class_type: 'GroundingDinoSAM2Segment (segment anything2)',
    inputs: {
      sam_model: ['3', 0], grounding_dino_model: ['2', 0], image: ['1', 0],
      prompt: prompts.secondary, threshold: prompts.secondaryTh,
      keep_model_loaded: true,
    },
  };
  w['12'] = {
    class_type: 'GroundingDinoSAM2Segment (segment anything2)',
    inputs: {
      sam_model: ['3', 0], grounding_dino_model: ['2', 0], image: ['1', 0],
      prompt: prompts.wall, threshold: prompts.wallTh,
      keep_model_loaded: true,
    },
  };
  w['13'] = {
    class_type: 'GroundingDinoSAM2Segment (segment anything2)',
    inputs: {
      sam_model: ['3', 0], grounding_dino_model: ['2', 0], image: ['1', 0],
      prompt: prompts.floor, threshold: prompts.floorTh,
      keep_model_loaded: true,
    },
  };
  w['14'] = {
    class_type: 'GroundingDinoSAM2Segment (segment anything2)',
    inputs: {
      sam_model: ['3', 0], grounding_dino_model: ['2', 0], image: ['1', 0],
      prompt: prompts.ceiling, threshold: prompts.ceilingTh,
      keep_model_loaded: false, // ← Frees ~850MB VRAM
    },
  };

  // ── Node 15: Depth Map (runs after DINO+SAM2 unloaded) ───────────────────
  w['15'] = {
    class_type: 'DepthAnythingV2Preprocessor',
    inputs: { image: ['1', 0], ckpt_name: 'depth_anything_v2_vits.pth', resolution: 1024 },
  };

  // ── Node 20: Combine Objects (furniture OR secondary) ─────────────────────
  w['20'] = {
    class_type: 'MaskComposite',
    inputs: { destination: ['10', 1], source: ['11', 1], x: 0, y: 0, operation: 'or' },
  };

  // ── Nodes 21a, 21, 22, 23: Subtraction Chain ─────────────────────────────
  // wall_clean = wall − floor − objects
  w['21a'] = {
    class_type: 'MaskComposite',
    inputs: { destination: ['12', 1], source: ['13', 1], x: 0, y: 0, operation: 'subtract' },
  };
  w['21'] = {
    class_type: 'MaskComposite',
    inputs: { destination: ['21a', 0], source: ['20', 0], x: 0, y: 0, operation: 'subtract' },
  };
  // floor_clean = floor − objects
  w['22'] = {
    class_type: 'MaskComposite',
    inputs: { destination: ['13', 1], source: ['20', 0], x: 0, y: 0, operation: 'subtract' },
  };
  // ceiling_clean = ceiling − objects
  w['23'] = {
    class_type: 'MaskComposite',
    inputs: { destination: ['14', 1], source: ['20', 0], x: 0, y: 0, operation: 'subtract' },
  };

  // ── Nodes 30-33: GrowMaskWithBlur Post-Processing ────────────────────────
  w['30'] = {
    class_type: 'GrowMaskWithBlur',
    inputs: {
      mask: ['21', 0], expand: 6, incremental_expandrate: 0.0,
      tapered_corners: true, flip_input: false,
      blur_radius: 4.0, lerp_alpha: 1.0, decay_factor: 1.0, fill_holes: true,
    },
  };
  w['31'] = {
    class_type: 'GrowMaskWithBlur',
    inputs: {
      mask: ['22', 0], expand: 3, incremental_expandrate: 0.0,
      tapered_corners: true, flip_input: false,
      blur_radius: 2.0, lerp_alpha: 1.0, decay_factor: 1.0, fill_holes: true,
    },
  };
  w['32'] = {
    class_type: 'GrowMaskWithBlur',
    inputs: {
      mask: ['20', 0], expand: 3, incremental_expandrate: 0.0,
      tapered_corners: true, flip_input: false,
      blur_radius: 2.0, lerp_alpha: 1.0, decay_factor: 1.0, fill_holes: false, // preserve object boundaries
    },
  };
  w['33'] = {
    class_type: 'GrowMaskWithBlur',
    inputs: {
      mask: ['23', 0], expand: 2, incremental_expandrate: 0.0,
      tapered_corners: true, flip_input: false,
      blur_radius: 2.0, lerp_alpha: 1.0, decay_factor: 1.0, fill_holes: true,
    },
  };

  // ── Node 34: Empty Space = refined floor − refined objects ────────────────
  w['34'] = {
    class_type: 'MaskComposite',
    inputs: { destination: ['31', 0], source: ['32', 0], x: 0, y: 0, operation: 'subtract' },
  };

  // ── Nodes 40-44: MaskToImage Conversions ──────────────────────────────────
  w['40'] = { class_type: 'MaskToImage', inputs: { mask: ['30', 0] } };
  w['41'] = { class_type: 'MaskToImage', inputs: { mask: ['31', 0] } };
  w['42'] = { class_type: 'MaskToImage', inputs: { mask: ['32', 0] } };
  w['43'] = { class_type: 'MaskToImage', inputs: { mask: ['33', 0] } };
  w['44'] = { class_type: 'MaskToImage', inputs: { mask: ['34', 0] } };

  // ── Nodes 50-55: SaveImage Outputs ────────────────────────────────────────
  w['50'] = { class_type: 'SaveImage', inputs: { images: ['40', 0], filename_prefix: 'stage1/wall_mask' } };
  w['51'] = { class_type: 'SaveImage', inputs: { images: ['41', 0], filename_prefix: 'stage1/floor_mask' } };
  w['52'] = { class_type: 'SaveImage', inputs: { images: ['42', 0], filename_prefix: 'stage1/object_mask' } };
  w['53'] = { class_type: 'SaveImage', inputs: { images: ['43', 0], filename_prefix: 'stage1/ceiling_mask' } };
  w['54'] = { class_type: 'SaveImage', inputs: { images: ['44', 0], filename_prefix: 'stage1/empty_mask' } };
  w['55'] = { class_type: 'SaveImage', inputs: { images: ['15', 0], filename_prefix: 'stage1/depth_map' } };

  return { workflow: w, uploadedFilename: filename };
}

/**
 * Parse Stage 1 stable workflow outputs from ComfyUI history.
 * Maps filename prefixes to semantic keys.
 *
 * ComfyUI generates filenames like:
 *   "stage1/wall_mask_00001_.png"  → key: "wall_mask"
 *   "stage1/empty_mask_00001_.png" → key: "empty_space_mask"
 *
 * We match on the basename after the last '/' to avoid subfolder false positives.
 */
export function parseStableSceneOutputs(
  historyOutputs: Record<string, { images?: Array<{ filename: string; subfolder: string; type: string }> }>
): Record<string, string> {
  const result: Record<string, string> = {};

  // Ordered from most specific to least specific to prevent substring collisions
  const prefixMap: [string, string][] = [
    ['empty_mask',   'empty_space_mask'],
    ['ceiling_mask', 'ceiling_mask'],
    ['object_mask',  'object_mask'],
    ['floor_mask',   'floor_mask'],
    ['wall_mask',    'wall_mask'],
    ['depth_map',    'depth_map'],
  ];

  for (const nodeId in historyOutputs) {
    const images = historyOutputs[nodeId]?.images;
    if (!images || images.length === 0) continue;
    const fname = images[0].filename;
    // Extract basename: "stage1/wall_mask_00001_.png" → "wall_mask_00001_.png"
    const basename = fname.includes('/') ? fname.split('/').pop()! : fname;

    for (const [prefix, key] of prefixMap) {
      if (basename.startsWith(prefix)) {
        result[key] = fname;
        break; // One match per node — prevents overwriting
      }
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADVANCED TOOL WORKFLOW — Stage 1 + Tool-Specific Workflow Orchestration
// ═══════════════════════════════════════════════════════════════════════════════
//
// createAdvancedToolWorkflow() is the unified TypeScript entry point for all
// mask-aware tool workflows. It:
//   1. Generates the Stage 1 scene understanding workflow (pure DINO+SAM2)
//   2. Returns instructions for the bridge to run Stage 1, extract masks,
//      then build and run the tool-specific workflow with enriched params.
//
// This is the TS equivalent of comfyBridge.enqueueSmartTabJob().
// ═══════════════════════════════════════════════════════════════════════════════

/** Tool types that benefit from pre-computed scene masks */
export type SceneAwareTool =
  | 'render'
  | 'edit'
  | 'furnish'
  | 'empty-room'
  | 'auto-edit'
  | 'interior-render';

/** Tool types that don't need scene analysis */
export type DirectTool =
  | 'lighting'
  | 'postprocess'
  | 'lineart'
  | 'exterior-render'
  | 'background'
  | 'style-transfer'
  | 'view-extend'
  | 'collage'
  | 'landscape';

export type ToolType = SceneAwareTool | DirectTool;

/** Scene masks produced by Stage 1 */
export interface SceneMasks {
  wall_mask: string;
  floor_mask: string;
  ceiling_mask: string;
  object_mask: string;
  empty_space_mask: string;
  depth_map: string;
}

/** Optimized parameters for RTX 4060 8GB */
export const OPTIMIZED_DEFAULTS = {
  // Stage 1 — Scene Understanding
  scene: {
    dinoModel: 'GroundingDINO_SwinT_OGC (694MB)',   // SwinT = 694MB, SwinB = 938MB
    sam2Model: 'sam2_hiera_small.pt',                // small=150MB, base_plus=350MB
    depthModel: 'depth_anything_v2_vits.pth',        // vits=100MB, vitb=300MB
    depthResolution: 1024,
    keepModelLoaded: true,                           // true for passes 1-4, false for pass 5
  },
  // Stage 2 — Render / Redesign
  render: {
    cannyLow: 100, cannyHigh: 200,
    cannyStrength: 0.85,
    depthCannyLow: 50, depthCannyHigh: 150,
    depthCannyStrength: 0.51,                        // 60% of primary canny
    depthCannyEndPercent: 0.70,                      // fade out at 70%
    kSamplerSteps: 25,
    cfg: 7.0,
    denoise: 0.75,
    sampler: 'dpmpp_2m',
    scheduler: 'karras',
  },
  // Stage 3 — Edit / Inpaint
  edit: {
    depthCannyStrength: 0.40,
    depthCannyEndPercent: 0.60,
    growMaskExpand: 8,
    kSamplerSteps: 22,
    cfg: 7.0,
    denoise: 0.65,
  },
  // Stage 4 — Furnish
  furnish: {
    ipAdapterWeight: 0.45,
    depthCannyStrength: 0.50,
    kSamplerSteps: 20,
    cfg: 6.5,
    denoise: 0.55,
  },
  // Post-processing
  maskPostProcess: {
    wall:    { expand: 6, blur: 4.0, fillHoles: true },
    floor:   { expand: 3, blur: 2.0, fillHoles: true },
    object:  { expand: 3, blur: 2.0, fillHoles: false },  // NEVER fill holes on objects
    ceiling: { expand: 2, blur: 2.0, fillHoles: true },
  },
  // VRAM management
  vram: {
    flushBetweenStages: true,
    flushDelayMs: 500,
    maxPeakMB: 950,
  },
} as const;

/** Parameters for createAdvancedToolWorkflow */
export interface AdvancedToolParams {
  /** Base64-encoded image (with or without data:image prefix) */
  imageBase64: string;
  /** Tool type to execute */
  toolType: ToolType;
  /** Indian room type for optimized DINO prompts */
  roomType?: string;

  // ─── Render-specific ─────────────────────────────────────────
  /** Interior design style (e.g., "modern minimalist") */
  style?: string;
  /** Additional user prompt text */
  prompt?: string;
  /** Denoise strength (0.3–0.95) */
  strength?: number;
  /** ControlNet canny strength */
  cannyStrength?: number;
  /** Style reference image (base64 or filename) */
  referenceImage?: string;

  // ─── Edit-specific ───────────────────────────────────────────
  /** User-painted mask (base64) */
  maskBase64?: string;
  /** Negative prompt for inpainting */
  negativePrompt?: string;

  // ─── Furnish-specific ────────────────────────────────────────
  /** Furniture image (base64, BG-removed) */
  furnitureImageBase64?: string;
  /** Placement description (e.g., "center of room") */
  placement?: string;

  // ─── Auto-edit-specific ──────────────────────────────────────
  /** Object to auto-detect and edit */
  objectToEdit?: string;
  /** Description of the edit */
  editDescription?: string;

  // ─── Bypass ──────────────────────────────────────────────────
  /** Skip Stage 1 if masks are already available */
  skipSceneAnalysis?: boolean;
  /** Pre-computed masks (skips Stage 1) */
  precomputedMasks?: Partial<SceneMasks>;
}

/** Result from createAdvancedToolWorkflow */
export interface AdvancedToolResult {
  /** Stage 1 workflow (or null if skipped) */
  sceneWorkflow: StableSceneWorkflowResult | null;
  /** Tool-specific workflow generation instructions */
  toolInstructions: {
    /** Tool type */
    tool: ToolType;
    /** Scene-aware: bridge should run Stage 1 first */
    requiresSceneAnalysis: boolean;
    /** Parameters to pass to the JS tab builder (ultraProBuilder.js) */
    builderParams: Record<string, any>;
    /** Which masks from Stage 1 this tool needs */
    requiredMasks: (keyof SceneMasks)[];
  };
  /** Recommended parameters */
  optimizedParams: typeof OPTIMIZED_DEFAULTS;
}

/** Set of tools that benefit from pre-computed scene masks */
const SCENE_AWARE_TOOLS: Set<string> = new Set([
  'render', 'edit', 'furnish', 'empty-room', 'auto-edit', 'interior-render',
]);

/** Which masks each tool type actually uses */
const TOOL_MASK_REQUIREMENTS: Record<SceneAwareTool, (keyof SceneMasks)[]> = {
  'render':          ['depth_map'],
  'edit':            ['depth_map'],
  'furnish':         ['empty_space_mask', 'depth_map', 'object_mask'],
  'empty-room':      ['object_mask', 'wall_mask', 'floor_mask'],
  'auto-edit':       ['wall_mask', 'floor_mask', 'object_mask', 'depth_map'],
  'interior-render': ['depth_map'],
};

/**
 * Create an advanced tool workflow with automatic Stage 1 scene understanding.
 *
 * This is the **unified TypeScript entry point** for all tool workflows.
 * For scene-aware tools (render, edit, furnish, etc.), it generates the Stage 1
 * workflow and provides instructions for the bridge to:
 *   1. Run Stage 1 → extract masks
 *   2. Inject masks into the tool workflow builder
 *   3. Run the enriched tool workflow
 *
 * For direct tools (lighting, lineart, etc.), it bypasses Stage 1.
 *
 * @example
 * ```ts
 * const result = createAdvancedToolWorkflow({
 *   imageBase64: 'data:image/png;base64,...',
 *   toolType: 'render',
 *   roomType: 'living_room',
 *   style: 'modern minimalist',
 *   strength: 0.75,
 * });
 *
 * // 1. Submit result.sceneWorkflow.workflow to ComfyUI
 * // 2. Parse outputs with parseStableSceneOutputs()
 * // 3. Build tool workflow with result.toolInstructions.builderParams + masks
 * // 4. Submit tool workflow to ComfyUI
 * ```
 */
export function createAdvancedToolWorkflow(params: AdvancedToolParams): AdvancedToolResult {
  const {
    imageBase64,
    toolType,
    roomType = 'general',
    skipSceneAnalysis = false,
    precomputedMasks,
  } = params;

  const isSceneAware = SCENE_AWARE_TOOLS.has(toolType);
  const hasMasks = precomputedMasks
    && precomputedMasks.depth_map
    && precomputedMasks.object_mask;

  // ── Stage 1 workflow (if needed) ──────────────────────────────────
  let sceneWorkflow: StableSceneWorkflowResult | null = null;

  if (isSceneAware && !skipSceneAnalysis && !hasMasks) {
    sceneWorkflow = createStableSceneUnderstandingWorkflow(imageBase64, roomType);
  }

  // ── Tool-specific builder parameters ──────────────────────────────
  const builderParams = buildToolParams(params);

  // ── Required masks for this tool ──────────────────────────────────
  const requiredMasks = isSceneAware
    ? (TOOL_MASK_REQUIREMENTS[toolType as SceneAwareTool] || [])
    : [];

  return {
    sceneWorkflow,
    toolInstructions: {
      tool: toolType,
      requiresSceneAnalysis: isSceneAware && !skipSceneAnalysis && !hasMasks,
      builderParams,
      requiredMasks,
    },
    optimizedParams: OPTIMIZED_DEFAULTS,
  };
}

/**
 * Build tool-specific parameters for the JS workflow builder.
 * These params get merged with scene masks and passed to
 * buildRenderWorkflow / buildEditWorkflow / etc.
 */
function buildToolParams(params: AdvancedToolParams): Record<string, any> {
  const base: Record<string, any> = {
    roomType: params.roomType || 'general',
  };

  switch (params.toolType) {
    case 'render':
    case 'interior-render':
      return {
        ...base,
        style: params.style || 'modern minimalist',
        prompt: params.prompt || '',
        strength: params.strength ?? OPTIMIZED_DEFAULTS.render.denoise,
        cannyStrength: params.cannyStrength ?? OPTIMIZED_DEFAULTS.render.cannyStrength,
        referenceImage: params.referenceImage || null,
      };

    case 'edit':
      return {
        ...base,
        prompt: params.prompt || 'high quality interior detail, photorealistic',
        negativePrompt: params.negativePrompt || 'blurry, low quality, artifacts, distorted perspective',
        denoise: params.strength ?? OPTIMIZED_DEFAULTS.edit.denoise,
        // maskFilename is set by the bridge after saving maskBase64 to disk
      };

    case 'furnish':
      return {
        ...base,
        prompt: params.prompt || '',
        placement: params.placement || '',
        // furnitureImage is set by the bridge after saving furnitureImageBase64
      };

    case 'empty-room':
      return {
        ...base,
        objectsToRemove: params.objectToEdit || 'all furniture',
      };

    case 'auto-edit':
      return {
        ...base,
        objectToEdit: params.objectToEdit || 'wall',
        editDescription: params.editDescription || 'white painted wall',
        denoise: params.strength ?? 0.55,
      };

    default:
      return {
        ...base,
        prompt: params.prompt || '',
        strength: params.strength ?? 0.75,
      };
  }
}

/**
 * Recommended UI slider configuration.
 *
 * Use this to render sliders in the frontend for each tool type.
 * All values are bounded and pre-tuned for RTX 4060 8GB.
 */
export const UI_SLIDER_CONFIG = {
  render: [
    { key: 'strength',      label: 'Redesign Strength', min: 0.30, max: 0.95, default: 0.75, step: 0.05,
      tooltip: 'How much to change the room (0.3 = subtle, 0.95 = full redesign)' },
    { key: 'cannyStrength',  label: 'Structure Lock',    min: 0.40, max: 1.00, default: 0.85, step: 0.05,
      tooltip: 'How strongly to preserve walls, edges, and geometry' },
  ],
  edit: [
    { key: 'denoise',       label: 'Edit Intensity',    min: 0.30, max: 0.90, default: 0.65, step: 0.05,
      tooltip: 'How much to change the masked region (0.3 = subtle, 0.9 = full replace)' },
  ],
  furnish: [
    { key: 'ipWeight',      label: 'Furniture Fidelity', min: 0.20, max: 0.70, default: 0.45, step: 0.05,
      tooltip: 'How closely to match the furniture reference (higher = more accurate but less natural)' },
  ],
  'auto-edit': [
    { key: 'denoise',       label: 'Edit Strength',      min: 0.30, max: 0.80, default: 0.55, step: 0.05,
      tooltip: 'How much to change the detected object' },
    { key: 'threshold',     label: 'Detection Sensitivity', min: 0.15, max: 0.50, default: 0.35, step: 0.05,
      tooltip: 'Lower = detect more objects, higher = only confident matches' },
  ],
} as const;
