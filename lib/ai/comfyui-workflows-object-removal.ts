// lib/ai/comfyui-workflows-object-removal.ts
import { GenerationRequest } from "./comfyui-bridge";

export interface ObjectRemovalRequest extends GenerationRequest {
  removalMethod: 'lama' | 'flux_fill' | 'sam2';
  maskData?: {
    coordinates?: { x: number; y: number; width: number; height: number };
    maskImage?: string; // Base64 encoded mask
    autoDetect?: boolean; // For SAM 2
  };
  replacementPrompt?: string; // For Flux.1 Fill method
  settings: {
    method: 'professional' | 'high_end' | 'autonomous';
    creativity: number;
    num_inference_steps: number;
    guidance_scale: number;
  };
}

export function createLaMaObjectRemovalWorkflow(request: ObjectRemovalRequest) {
  const { image, maskData, settings } = request;

  return {
    "prompt": {
      // 1: Load Input Image
      "1": {
        "inputs": {
          "image": image,
          "upload": "image"
        },
        "class_type": "LoadImage"
      },

      // 2: Load or Create Mask
      "2": maskData?.maskImage ? {
        "inputs": {
          "mask": maskData.maskImage,
          "upload": "mask"
        },
        "class_type": "LoadImageMask"
      } : {
        "inputs": {
          "image": ["1", 0],
          "coordinates": maskData?.coordinates || { x: 100, y: 100, width: 200, height: 150 },
          "brush_size": 10
        },
        "class_type": "MaskEditor"
      },

      // 3: LaMa Object Removal (Professional Method)
      "3": {
        "inputs": {
          "image": ["1", 0],
          "mask": ["2", 0],
          "model": "lama_large",
          "device": "cuda",
          "pad_size": 32
        },
        "class_type": "LaMaRemoveObject"
      },

      // 4: Save Result
      "4": {
        "inputs": {
          "filename_prefix": `lama-removal-${Date.now()}`,
          "images": ["3", 0]
        },
        "class_type": "SaveImage"
      }
    }
  };
}

export function createFluxFillObjectRemovalWorkflow(request: ObjectRemovalRequest) {
  const { image, maskData, replacementPrompt, settings } = request;

  return {
    "prompt": {
      // 1: Load Checkpoint (Flux.1 or SDXL Inpaint)
      "1": {
        "inputs": {
          "ckpt_name": "flux1-schnell.safetensors" // or SDXL inpaint model
        },
        "class_type": "CheckpointLoaderSimple"
      },

      // 2: Load VAE (For Inpainting)
      "2": {
        "inputs": {
          "vae_name": "sdxl_vae.safetensors"
        },
        "class_type": "VAELoader"
      },

      // 3: Load Input Image
      "3": {
        "inputs": {
          "image": image,
          "upload": "image"
        },
        "class_type": "LoadImage"
      },

      // 4: Load or Create Mask
      "4": maskData?.maskImage ? {
        "inputs": {
          "mask": maskData.maskImage,
          "upload": "mask"
        },
        "class_type": "LoadImageMask"
      } : {
        "inputs": {
          "image": ["3", 0],
          "coordinates": maskData?.coordinates || { x: 100, y: 100, width: 200, height: 150 },
          "brush_size": 10
        },
        "class_type": "MaskEditor"
      },

      // 5: VAE Encode (For Inpainting)
      "5": {
        "inputs": {
          "pixels": ["3", 0],
          "vae": ["2", 0],
          "mask": ["4", 0]
        },
        "class_type": "VAEEncodeForInpaint"
      },

      // 6: Positive Prompt (What to replace object with)
      "6": {
        "inputs": {
          "text": replacementPrompt || "clean empty space, minimalist room, seamless background",
          "clip": ["1", 1]
        },
        "class_type": "CLIPTextEncode"
      },

      // 7: Negative Prompt
      "7": {
        "inputs": {
          "text": "blurry, low quality, distorted, artifacts, seams, visible mask edges",
          "clip": ["1", 1]
        },
        "class_type": "CLIPTextEncode"
      },

      // 8: KSampler (High-End Method)
      "8": {
        "inputs": {
          "seed": Math.floor(Math.random() * 2147483647),
          "steps": settings.num_inference_steps || 20,
          "cfg": settings.guidance_scale || 7.5,
          "sampler_name": "dpmpp_2m",
          "scheduler": "karras",
          "denoise": 0.8,
          "model": ["1", 0],
          "positive": ["6", 0],
          "negative": ["7", 0],
          "latent_image": ["5", 0]
        },
        "class_type": "KSampler"
      },

      // 9: VAE Decode
      "9": {
        "inputs": {
          "samples": ["8", 0],
          "vae": ["2", 0]
        },
        "class_type": "VAEDecode"
      },

      // 10: Save Result
      "10": {
        "inputs": {
          "filename_prefix": `flux-fill-${Date.now()}`,
          "images": ["9", 0]
        },
        "class_type": "SaveImage"
      }
    }
  };
}

export function createSAM2ObjectRemovalWorkflow(request: ObjectRemovalRequest) {
  const { image, maskData, settings } = request;

  return {
    "prompt": {
      // 1: Load Input Image
      "1": {
        "inputs": {
          "image": image,
          "upload": "image"
        },
        "class_type": "LoadImage"
      },

      // 2: Segment Anything 2 (Autonomous Detection)
      "2": {
        "inputs": {
          "image": ["1", 0],
          "model": "sam2_huge",
          "device": "cuda",
          "point_prompt": maskData?.coordinates ? [
            { point: [maskData.coordinates.x, maskData.coordinates.y], label: 1 }
          ] : [],
          "box_prompt": maskData?.coordinates ? [
            [maskData.coordinates.x, maskData.coordinates.y, 
             maskData.coordinates.x + maskData.coordinates.width, 
             maskData.coordinates.y + maskData.coordinates.height]
          ] : [],
          "multimask_output": true
        },
        "class_type": "SegmentAnything2"
      },

      // 3: Select Best Mask (from SAM 2 output)
      "3": {
        "inputs": {
          "masks": ["2", 0],
          "selection_method": "largest"
        },
        "class_type": "MaskSelector"
      },

      // 4: LaMa Object Removal (using SAM 2 mask)
      "4": {
        "inputs": {
          "image": ["1", 0],
          "mask": ["3", 0],
          "model": "lama_large",
          "device": "cuda",
          "pad_size": 32
        },
        "class_type": "LaMaRemoveObject"
      },

      // 5: Save Result
      "5": {
        "inputs": {
          "filename_prefix": `sam2-removal-${Date.now()}`,
          "images": ["4", 0]
        },
        "class_type": "SaveImage"
      }
    }
  };
}

export function createObjectRemovalWorkflow(request: ObjectRemovalRequest) {
  switch (request.removalMethod) {
    case 'lama':
      return createLaMaObjectRemovalWorkflow(request);
    case 'flux_fill':
      return createFluxFillObjectRemovalWorkflow(request);
    case 'sam2':
      return createSAM2ObjectRemovalWorkflow(request);
    default:
      return createLaMaObjectRemovalWorkflow(request); // Default to LaMa
  }
}

// Hardware optimization for 8GB VRAM
export function createOptimizedObjectRemovalWorkflow(request: ObjectRemovalRequest) {
  const optimized = { ...request };
  
  // Force optimizations for 8GB VRAM
  optimized.settings = {
    ...optimized.settings,
    num_inference_steps: optimized.settings.num_inference_steps > 15 ? 15 : optimized.settings.num_inference_steps,
  };

  const workflow = createObjectRemovalWorkflow(optimized);
  
  return workflow;
}
