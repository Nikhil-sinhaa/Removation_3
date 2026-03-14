// lib/ai/comfyui-workflows.ts
export interface ComfyUIWorkflow {
  [key: string]: {
    inputs: Record<string, any>;
    class_type: string;
  };
}

export interface StyleConfig {
  lora_name?: string;
  lora_strength?: number;
  prompt_suffix?: string;
  negative_prompt_suffix?: string;
}

export const STYLE_CONFIGS: Record<string, StyleConfig> = {
  'modern': {
    lora_name: 'modern_interior.safetensors',
    lora_strength: 0.8,
    prompt_suffix: ', modern interior design, clean lines, minimalist furniture',
    negative_prompt_suffix: ', ornate, vintage, traditional, cluttered'
  },
  'industrial': {
    lora_name: 'industrial_style.safetensors',
    lora_strength: 0.9,
    prompt_suffix: ', industrial interior, exposed brick, metal elements, raw materials',
    negative_prompt_suffix: ', polished, refined, delicate, soft colors'
  },
  'bohemian': {
    lora_name: 'bohemian_style.safetensors',
    lora_strength: 0.8,
    prompt_suffix: ', bohemian interior, eclectic decor, plants, textiles, warm colors',
    negative_prompt_suffix: ', minimalist, stark, monochromatic, rigid'
  },
  'minimalist': {
    lora_name: 'minimalist_style.safetensors',
    lora_strength: 0.7,
    prompt_suffix: ', minimalist interior, simple, clean, uncluttered, neutral colors',
    negative_prompt_suffix: ', ornate, decorative, busy, colorful'
  },
  'scandinavian': {
    lora_name: 'scandinavian_style.safetensors',
    lora_strength: 0.8,
    prompt_suffix: ', scandinavian interior, hygge, light wood, cozy, functional',
    negative_prompt_suffix: ', dark, heavy, ornate, traditional'
  },
  'luxury': {
    lora_name: 'luxury_interior.safetensors',
    lora_strength: 0.9,
    prompt_suffix: ', luxury interior, high-end materials, elegant, sophisticated',
    negative_prompt_suffix: ', cheap, basic, simple, ordinary'
  },
  'indian': {
    lora_name: 'indian_style.safetensors',
    lora_strength: 0.8,
    prompt_suffix: ', indian interior, traditional elements, vibrant colors, intricate patterns',
    negative_prompt_suffix: ', western, minimalist, monochromatic, plain'
  }
};

export const CONTROLNET_PRESETS = {
  'canny': 'control_canny-fp16.safetensors',
  'depth': 'control_depth-fp16.safetensors',
  'scribble': 'control_scribble-fp16.safetensors',
  'openpose': 'control_openpose-fp16.safetensors',
  'seg': 'control_seg-fp16.safetensors'
};

export function createInteriorDesignWorkflow(params: {
  mode: string;
  style: string;
  roomType: string;
  prompt: string;
  negativePrompt: string;
  imageName: string;
  settings: any;
  seed: number;
}): ComfyUIWorkflow {
  const { mode, style, roomType, prompt, negativePrompt, imageName, settings, seed } = params;
  const styleConfig = STYLE_CONFIGS[style.toLowerCase()] || STYLE_CONFIGS['modern'];
  
  // RTX 4060 optimized settings
  const optimizedSteps = settings.num_inference_steps || 25; // Reduced from 30
  const optimizedCfg = Math.min(settings.guidance_scale || 7, 8); // Cap at 8 for stability
  const optimizedDenoise = Math.min(settings.strength || 0.6, 0.8); // Cap for memory
  
  const baseWorkflow: ComfyUIWorkflow = {
    "1": {
      "inputs": {
        "ckpt_name": "sd_xl_base_1.0.safetensors"
      },
      "class_type": "CheckpointLoaderSimple"
    },
    "2": {
      "inputs": {
        "text": `${prompt}${styleConfig.prompt_suffix || ''}`,
        "clip": ["1", 1]
      },
      "class_type": "CLIPTextEncode"
    },
    "3": {
      "inputs": {
        "text": `${negativePrompt}${styleConfig.negative_prompt_suffix || ''}`,
        "clip": ["1", 1]
      },
      "class_type": "CLIPTextEncode"
    },
    "4": {
      "inputs": {
        "image": imageName,
        "vae": ["1", 2]
      },
      "class_type": "VAEEncodeForInpaint"
    },
    "5": {
      "inputs": {
        "seed": seed,
        "steps": optimizedSteps,
        "cfg": optimizedCfg,
        "sampler_name": "dpmpp_2m",
        "scheduler": "karras",
        "denoise": optimizedDenoise,
        "model": ["1", 0],
        "positive": ["2", 0],
        "negative": ["3", 0],
        "latent_image": ["4", 0]
      },
      "class_type": "KSampler"
    },
    "6": {
      "inputs": {
        "samples": ["5", 0],
        "vae": ["1", 2]
      },
      "class_type": "VAEDecode"
    },
    "7": {
      "inputs": {
        "filename_prefix": `removation-${mode}-${style}-${Date.now()}`,
        "images": ["6", 0]
      },
      "class_type": "SaveImage"
    }
  };

  // Add LoRA for style enhancement
  if (styleConfig.lora_name) {
    baseWorkflow["8"] = {
      "inputs": {
        "lora_name": styleConfig.lora_name,
        "strength_model": styleConfig.lora_strength || 0.8,
        "strength_clip": styleConfig.lora_strength || 0.8,
        "model": ["1", 0],
        "clip": ["1", 1]
      },
      "class_type": "LoRALoader"
    };

    // Update CLIP and model connections to use LoRA
    baseWorkflow["2"].inputs.clip = ["8", 1];
    baseWorkflow["3"].inputs.clip = ["8", 1];
    baseWorkflow["5"].inputs.model = ["8", 0];
  }

  // Add ControlNet for structural integrity with Canny preprocessor
  if (settings.preserveLayout && ['redesign', 'beautify', 'furnish'].includes(mode)) {
    const controlnetType = settings.controlnetType || 'canny';
    const controlnetStrength = settings.controlnetStrength || 1.8; // Higher strength for Qwen (1.5-2.0)
    
    // Canny Edge Preprocessor for structural locking
    baseWorkflow["8"] = {
      "inputs": {
        "image": imageName,
        "low_threshold": 100,
        "high_threshold": 200
      },
      "class_type": "CannyEdgePreprocessor"
    };
    
    baseWorkflow["9"] = {
      "inputs": {
        "control_net_name": CONTROLNET_PRESETS[controlnetType as keyof typeof CONTROLNET_PRESETS]
      },
      "class_type": "ControlNetLoader"
    };

    baseWorkflow["10"] = {
      "inputs": {
        "image": ["8", 0],
        "strength": controlnetStrength,
        "control_net": ["9", 0],
        "conditioning": ["2", 0]
      },
      "class_type": "ControlNetApply"
    };

    // Update KSampler to use ControlNet
    baseWorkflow["5"].inputs.positive = ["10", 0];
    
    // Use uni_pc sampler for better architectural preservation
    if (settings.architecturalMode) {
      baseWorkflow["5"].inputs.sampler_name = "uni_pc";
      baseWorkflow["5"].inputs.steps = Math.min(optimizedSteps, 20);
    }
  }

  // Special handling for sketch mode
  if (mode === 'sketch') {
    baseWorkflow["11"] = {
      "inputs": {
        "image": imageName,
        "control_net_name": CONTROLNET_PRESETS.scribble
      },
      "class_type": "ControlNetLoader"
    };

    baseWorkflow["12"] = {
      "inputs": {
        "image": imageName,
        "strength": 1.0,
        "control_net": ["11", 0],
        "conditioning": ["2", 0]
      },
      "class_type": "ControlNetApply"
    };

    baseWorkflow["5"].inputs.positive = ["12", 0];
    baseWorkflow["5"].inputs.denoise = 0.95; // Higher strength for sketches
  }

  // Special handling for enhance mode
  if (mode === 'enhance') {
    baseWorkflow["13"] = {
      "inputs": {
        "model_name": "RealESRGAN_x4plus.pth",
        "image": imageName
      },
      "class_type": "UpscaleModelLoader"
    };

    baseWorkflow["14"] = {
      "inputs": {
        "upscale_model": ["13", 0],
        "image": ["6", 0]
      },
      "class_type": "ImageUpscaleWithModel"
    };

    // Update SaveImage to use upscaled result
    baseWorkflow["7"].inputs.images = ["14", 0];
  }

  return baseWorkflow;
}

export function createInpaintingWorkflow(params: {
  prompt: string;
  negativePrompt: string;
  imageName: string;
  maskName: string;
  seed: number;
  settings: any;
}): ComfyUIWorkflow {
  const { prompt, negativePrompt, imageName, maskName, seed, settings } = params;
  
  return {
    "1": {
      "inputs": {
        "ckpt_name": "sd_xl_base_1.0.safetensors"
      },
      "class_type": "CheckpointLoaderSimple"
    },
    "2": {
      "inputs": {
        "text": prompt,
        "clip": ["1", 1]
      },
      "class_type": "CLIPTextEncode"
    },
    "3": {
      "inputs": {
        "text": negativePrompt,
        "clip": ["1", 1]
      },
      "class_type": "CLIPTextEncode"
    },
    "4": {
      "inputs": {
        "image": imageName,
        "vae": ["1", 2]
      },
      "class_type": "VAEEncodeForInpaint"
    },
    "5": {
      "inputs": {
        "mask": maskName,
        "vae": ["1", 2]
      },
      "class_type": "VAEEncodeForInpaint"
    },
    "6": {
      "inputs": {
        "seed": seed,
        "steps": settings.num_inference_steps || 50,
        "cfg": settings.guidance_scale || 7,
        "sampler_name": "dpmpp_2m",
        "scheduler": "karras",
        "denoise": 0.99,
        "model": ["1", 0],
        "positive": ["2", 0],
        "negative": ["3", 0],
        "latent_image": ["4", 0],
        "latent_noise": ["5", 0]
      },
      "class_type": "KSampler"
    },
    "7": {
      "inputs": {
        "samples": ["6", 0],
        "vae": ["1", 2]
      },
      "class_type": "VAEDecode"
    },
    "8": {
      "inputs": {
        "filename_prefix": `removation-inpaint-${Date.now()}`,
        "images": ["7", 0]
      },
      "class_type": "SaveImage"
    }
  };
}

export function getRoomTypePrompt(roomType: string): string {
  const roomPrompts: Record<string, string> = {
    'living_room': 'living room interior design, comfortable seating, coffee table, entertainment area',
    'bedroom': 'bedroom interior design, bed, nightstands, wardrobe, cozy atmosphere',
    'kitchen': 'kitchen interior design, cabinets, countertops, appliances, functional layout',
    'bathroom': 'bathroom interior design, vanity, shower, toilet, modern fixtures',
    'dining_room': 'dining room interior design, dining table, chairs, lighting, elegant setting',
    'office': 'home office interior design, desk, chair, storage, productive environment',
    'kids_room': "kids room interior design, playful, colorful, child-friendly furniture",
    'guest_room': 'guest room interior design, comfortable bed, welcoming atmosphere',
    'study': 'study room interior design, bookshelves, desk, reading area, quiet space',
    'basement': 'basement interior design, finished, comfortable, well-lit, functional space',
    'attic': 'attic interior design, converted, cozy, sloped ceilings, clever storage',
    'laundry': 'laundry room interior design, washer, dryer, storage, organized space',
    'garage': 'garage interior design, organized, storage, workspace, clean layout',
    'outdoor': 'outdoor living space, patio, garden, comfortable seating, natural elements'
  };

  return roomPrompts[roomType.toLowerCase()] || roomPrompts['living_room'];
}

export function getModePrompt(mode: string): string {
  const modePrompts: Record<string, string> = {
    'redesign': 'completely redesigned interior, new layout, modern furniture, fresh look',
    'beautify': 'enhanced interior design, improved aesthetics, better furniture placement, upgraded decor',
    'creative': 'creative interior design, unique elements, artistic approach, innovative layout',
    'furnish': 'fully furnished interior, complete furniture set, decorated, ready to use',
    'empty': 'empty room interior, no furniture, blank space, architectural view',
    'outdoor': 'outdoor living space, garden design, patio furniture, natural elements',
    'sketch': 'interior design sketch, architectural drawing, clean lines, professional rendering',
    'enhance': 'enhanced image quality, improved resolution, better lighting, refined details'
  };

  return modePrompts[mode] || modePrompts['redesign'];
}

// Architectural prompt builder for "Perfect Implementation"
export function buildArchitecturalPrompt(params: {
  mode: string;
  style: string;
  roomType: string;
  customPrompt: string;
  materials?: string[];
  preserveElements?: string[];
}): string {
  const { mode, style, roomType, customPrompt, materials, preserveElements } = params;
  
  // Base architectural formula
  let prompt = '(Architectural visualization:1.2), maintain original room geometry, ';
  
  // Add style
  prompt += `${style} design, `;
  
  // Add room type
  prompt += `${roomType.replace('_', ' ')}, `;
  
  // Add materials if specified
  if (materials && materials.length > 0) {
    prompt += `${materials.join(', ')} textures, `;
  }
  
  // Add preservation instructions
  if (preserveElements && preserveElements.length > 0) {
    prompt += `keep original ${preserveElements.join(', ')}, `;
  }
  
  // Add custom user prompt
  if (customPrompt) {
    prompt += `${customPrompt}, `;
  }
  
  // Add quality and lighting
  prompt += 'realistic lighting, 8k photo, professional interior photography';
  
  return prompt;
}

// Get optimized settings for architectural mode
export function getArchitecturalSettings(settings: any) {
  return {
    ...settings,
    // ControlNet settings for structural locking
    preserveLayout: true,
    controlnetType: 'canny',
    controlnetStrength: 1.8, // High strength for Qwen (1.5-2.0)
    architecturalMode: true,
    
    // Sampler settings for architectural preservation
    sampler_name: 'uni_pc',
    num_inference_steps: Math.min(settings?.num_inference_steps || 20, 20), // Cap at 20
    
    // Denoise settings
    denoise: 0.75, // Conservative for structure preservation
    
    // Canny thresholds for edge detection
    cannyLowThreshold: 100,
    cannyHighThreshold: 200,
  };
}
