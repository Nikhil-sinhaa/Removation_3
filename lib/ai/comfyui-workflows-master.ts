// lib/ai/comfyui-workflows-master.ts
import { GenerationRequest } from "./comfyui-bridge";

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

// Master Selector Options
export const MASTER_SELECTOR_OPTIONS = {
  wallColor: ['White', 'Navy Blue', 'Terracotta', 'Olive Green', 'Deep Emerald Green', 'Charcoal Gray', 'Cream', 'Sage'],
  ceiling: ['Plain White', 'Wooden Beams', 'Modern Tray with LED', 'Industrial Exposed', 'Vaulted Wood', 'Coffered', 'Drop Ceiling'],
  furnitureStyle: ['Minimalist Oak', 'Industrial Metal', 'Bohemian Rattan', 'Luxury Velvet', 'Scandinavian Birch', 'Modern Leather', 'Vintage Walnut'],
  floorType: ['Hardwood Oak', 'Marble', 'Polished Concrete', 'Carpet', 'Terracotta Tiles', 'Dark Wood', 'Light Maple', 'Slate'],
  lighting: ['Natural Light', 'Warm LED', 'Cool White', 'Industrial Pendant', 'Chandelier', 'Recessed Lighting', 'Track Lighting'],
  decorStyle: ['Modern Minimalist', 'Industrial Chic', 'Bohemian Eclectic', 'Luxury Contemporary', 'Scandinavian', 'Traditional', 'Art Deco']
};

// ArchAi3d-Qwen Material Presets (103+ presets)
export const ARCHAI3D_MATERIALS = {
  floors: [
    'Marble - Carrara White', 'Marble - Calacatta Gold', 'Marble - Nero Marquina', 'Marble - Emperador',
    'Hardwood - Oak Natural', 'Hardwood - Oak White', 'Hardwood - Walnut Dark', 'Hardwood - Maple Light',
    'Polished Concrete - Gray', 'Polished Concrete - White', 'Polished Concrete - Black', 'Polished Concrete - Terrazzo',
    'Terracotta Tiles - Traditional', 'Terracotta Tiles - Modern', 'Terracotta Tiles - Glazed', 'Terracotta Tiles - Patterned',
    'Slate - Black', 'Slate - Gray', 'Slate - Green', 'Slate - Rust',
    'Carpet - Neutral', 'Carpet - Patterned', 'Carpet - Shag', 'Carpet - Berber',
    'Vinyl - Wood Plank', 'Vinyl - Stone', 'Vinyl - Patterned', 'Vinyl - Solid'
  ],
  walls: [
    'Paint - White Matte', 'Paint - White Gloss', 'Paint - Navy Blue', 'Paint - Terracotta', 'Paint - Olive Green',
    'Paint - Emerald Green', 'Paint - Charcoal', 'Paint - Cream', 'Paint - Sage', 'Paint - Gray',
    'Wallpaper - Geometric', 'Wallpaper - Floral', 'Wallpaper - Textured', 'Wallpaper - Metallic',
    'Brick - Exposed Red', 'Brick - Painted White', 'Brick - Dark', 'Brick - Weathered',
    'Wood Paneling - Light', 'Wood Paneling - Dark', 'Wood Paneling - Reclaimed', 'Wood Paneling - Modern',
    'Stone - Natural', 'Stone - Veneer', 'Stone - Slate', 'Stone - Marble',
    'Tile - Subway', 'Tile - Hexagon', 'Tile - Arabesque', 'Tile - Large Format',
    'Concrete - Raw', 'Concrete - Polished', 'Concrete - Colored', 'Concrete - Textured'
  ],
  ceilings: [
    'Paint - White Flat', 'Paint - White Eggshell', 'Paint - Textured', 'Paint - Color Wash',
    'Wood Beams - Natural', 'Wood Beams - Painted', 'Wood Beams - Dark', 'Wood Beams - Reclaimed',
    'Tray - Modern LED', 'Tray - Traditional', 'Tray - Multi-Level', 'Tray - Cove Lighting',
    'Coffered - Classic', 'Coffered - Modern', 'Coffered - Deep', 'Coffered - Shallow',
    'Vaulted - Exposed Wood', 'Vaulted - Painted', 'Vaulted - Plaster', 'Vaulted - Steel Beams',
    'Industrial - Exposed Duct', 'Industrial - Metal Panels', 'Industrial - Concrete', 'Industrial - Steel Beams',
    'Drop - Acoustic Tiles', 'Drop - Gypsum', 'Drop - Perforated', 'Drop - Linear',
    'Specialty - Murals', 'Specialty - Mirrored', 'Specialty - Fabric', 'Specialty - Metallic'
  ]
};

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
