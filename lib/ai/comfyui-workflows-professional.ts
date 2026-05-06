// ⚠️ DEPRECATED — NOT USED IN PRODUCTION ⚠️
//
// This file is a reference/design artifact and is NOT called by any active code.
// THE ACTIVE PIPELINE IS:
//   src/services/comfyBridge.js → enqueueUltraProJob()
//   src/workflows/ultraProBuilder.js → buildStage1..6()
//
// This file contains node class_types NOT confirmed installed in ComfyUI:
//   - ArchAi3DQwenEncoderV2 (proprietary custom node — not installed)
//   - ArchAi3dRoomTransformPromptBuilder (proprietary custom node — not installed)
//   - Qwen-Image-InstantX-ControlNet-Union.safetensors (model not confirmed installed)
// This is a single-stage workflow, not a 6-stage pipeline.
//
// lib/ai/comfyui-workflows-professional.ts


export interface ProfessionalGenerationRequest extends GenerationRequest {
  structuralLock: {
    enabled: boolean;
    strength: number; // 1.5 to 2.0
    preprocessor: 'canny' | 'depth' | 'hed';
    cannyThreshold: [number, number]; // [low, high]
  };
  encoderV2: {
    contextStrength: number; // 0.95
    userTextStrength: number; // 0.6
    twoStageInterpolation: boolean;
  };
  masterPrompt: {
    mode: 'remove_paint_selective' | 'architectural_visualization';
    materials: {
      [key: string]: 'keep_original' | string;
    };
    style: string;
    promptFormula: string;
  };
  hardwareOptimization: {
    useTiledVAE: boolean;
    useFP8: boolean;
    useHighVRAM: boolean;
    sampler: string;
    steps: number;
  };
}

export const PROFESSIONAL_PRESETS = {
  // Structural Lock Settings
  structuralLock: {
    conservative: { strength: 1.5, preprocessor: 'canny' as const, cannyThreshold: [50, 100] },
    standard: { strength: 1.8, preprocessor: 'canny' as const, cannyThreshold: [100, 200] },
    aggressive: { strength: 2.0, preprocessor: 'canny' as const, cannyThreshold: [150, 250] },
  },

  // Encoder V2 Settings
  encoderV2: {
    realityFocused: { contextStrength: 0.95, userTextStrength: 0.6, twoStageInterpolation: true },
    balanced: { contextStrength: 0.85, userTextStrength: 0.7, twoStageInterpolation: true },
    creative: { contextStrength: 0.75, userTextStrength: 0.8, twoStageInterpolation: false },
  },

  // Hardware Optimization for 8GB VRAM
  hardwareOptimization: {
    conservative: { useTiledVAE: true, useFP8: true, useHighVRAM: false, sampler: 'uni_pc', steps: 15 },
    standard: { useTiledVAE: true, useFP8: true, useHighVRAM: true, sampler: 'uni_pc', steps: 20 },
    quality: { useTiledVAE: false, useFP8: false, useHighVRAM: true, sampler: 'dpmpp_2m', steps: 25 },
  },

  // Material Presets (ArchAi3d compatible)
  materials: {
    walls: ['keep_original', 'Navy Blue', 'Terracotta', 'Olive Green', 'White', 'Charcoal Gray'],
    ceilings: ['keep_original', 'Wooden Beams', 'Plain White', 'Modern Tray with LED', 'Industrial Exposed'],
    furniture: ['keep_original', 'Minimalist Oak', 'Industrial Metal', 'Bohemian Rattan', 'Luxury Velvet'],
    floors: ['keep_original', 'Hardwood Oak', 'Marble', 'Polished Concrete', 'Terracotta Tiles'],
    lighting: ['keep_original', 'Natural Light', 'Warm LED', 'Cool White', 'Industrial Pendant'],
  },
};

export function createProfessionalWorkflow(request: ProfessionalGenerationRequest) {
  const { image, structuralLock, encoderV2, masterPrompt, hardwareOptimization } = request;

  return {
    "prompt": {
      // 1: Load Checkpoint
      "1": {
        "inputs": {
          "ckpt_name": "sd_xl_base_1.0.safetensors"
        },
        "class_type": "CheckpointLoaderSimple"
      },

      // 2: Load VAE (Tiled if enabled)
      "2": {
        "inputs": {
          "vae_name": "sdxl_vae.safetensors"
        },
        "class_type": "VAELoader"
      },

      // 3: Load ControlNet Model (InstantX Qwen Union)
      "3": {
        "inputs": {
          "control_net_name": "Qwen-Image-InstantX-ControlNet-Union.safetensors"
        },
        "class_type": "ControlNetLoader"
      },

      // 4: Load Input Image
      "4": {
        "inputs": {
          "image": image, // Will be replaced with actual image path
          "upload": "image"
        },
        "class_type": "LoadImage"
      },

      // 5: Canny Preprocessor (Structural Lock)
      "5": {
        "inputs": {
          "image": ["4", 0],
          "low_threshold": structuralLock.cannyThreshold[0],
          "high_threshold": structuralLock.cannyThreshold[1]
        },
        "class_type": "CannyPreprocessor"
      },

      // 6: Apply ControlNet (Structural Lock)
      "6": {
        "inputs": {
          "conditioning": ["7", 0],
          "control_net": ["3", 0],
          "image": ["5", 0],
          "strength": structuralLock.strength,
          "start_percent": 0.0,
          "end_percent": 1.0
        },
        "class_type": "ControlNetApply"
      },

      // 7: ArchAi3D Qwen Encoder V2
      "7": {
        "inputs": {
          "image": ["4", 0],
          "context_strength": encoderV2.contextStrength,
          "user_text_strength": encoderV2.userTextStrength,
          "two_stage_interpolation": encoderV2.twoStageInterpolation,
          "prompt": masterPrompt.promptFormula
        },
        "class_type": "ArchAi3DQwenEncoderV2"
      },

      // 8: Room Transform Prompt Builder (Vastu-Safe)
      "8": {
        "inputs": {
          "mode": masterPrompt.mode,
          "room_type": request.roomType,
          "wall_material": masterPrompt.materials.walls,
          "ceiling_material": masterPrompt.materials.ceiling || masterPrompt.materials.ceilings,
          "furniture_material": masterPrompt.materials.furniture,
          "floor_material": masterPrompt.materials.floors,
          "lighting_material": masterPrompt.materials.lighting,
          "style": masterPrompt.style,
          "vastu_compliant": true,
          "architectural_accuracy": "high",
          "realism_level": "photorealistic"
        },
        "class_type": "ArchAi3dRoomTransformPromptBuilder"
      },

      // 9: Enhanced Positive Prompt
      "9": {
        "inputs": {
          "text": ["8", 0], // Output from Room Transform Prompt Builder
          "clip": ["1", 1]
        },
        "class_type": "CLIPTextEncode"
      },

      // 10: Negative Prompt (Enhanced)
      "10": {
        "inputs": {
          "text": "blurry, low quality, distorted, watermark, text, cartoon, anime, unrealistic, bad architecture, plastic, fake, weight spikes, perspective changes, structural deformation",
          "clip": ["1", 1]
        },
        "class_type": "CLIPTextEncode"
      },

      // 11: KSampler (Hardware Optimized)
      "11": {
        "inputs": {
          "seed": Math.floor(Math.random() * 2147483647),
          "steps": hardwareOptimization.steps,
          "cfg": 7.5,
          "sampler_name": hardwareOptimization.sampler,
          "scheduler": "karras",
          "denoise": 0.75,
          "model": ["1", 0],
          "positive": ["6", 0], // Use ControlNet conditioned prompt
          "negative": ["10", 0],
          "latent_image": ["12", 0]
        },
        "class_type": "KSampler"
      },

      // 12: Empty Latent Image
      "12": {
        "inputs": {
          "width": 1024,
          "height": 1024,
          "batch_size": 1
        },
        "class_type": "EmptyLatentImage"
      },

      // 13: VAE Decode (Tiled if enabled)
      "13": {
        "inputs": {
          "samples": ["11", 0],
          "vae": ["2", 0],
          "tiling": hardwareOptimization.useTiledVAE ? 512 : 0
        },
        "class_type": hardwareOptimization.useTiledVAE ? "VAEDecodeTiled" : "VAEDecode"
      },

      // 14: Save Image
      "14": {
        "inputs": {
          "filename_prefix": `professional-${masterPrompt.mode}-${Date.now()}`,
          "images": ["13", 0]
        },
        "class_type": "SaveImage"
      }
    }
  };
}

export function createHardwareOptimizedWorkflow(request: ProfessionalGenerationRequest) {
  // Optimized workflow for 8GB VRAM MSI Katana
  const optimized = { ...request };
  
  // Force hardware optimizations for 8GB VRAM
  optimized.hardwareOptimization = {
    useTiledVAE: true,
    useFP8: true,
    useHighVRAM: false,
    sampler: 'uni_pc',
    steps: 15,
  };

  // Reduce image size for memory efficiency
  const workflow = createProfessionalWorkflow(optimized);
  
  // Modify latent size for memory efficiency
  workflow.prompt["12"].inputs.width = 768;
  workflow.prompt["12"].inputs.height = 768;
  
  return workflow;
}
