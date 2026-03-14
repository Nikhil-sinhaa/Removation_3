// app/api/master/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import axios from "axios";

export async function POST(req: NextRequest) {
  try {
    console.log("🎯 Starting Master Selector generation...");
    
    // Parse form data
    const formData = await req.formData();
    const imageFile = formData.get('image') as File;
    const jsonData = formData.get('data') as string;

    if (!imageFile) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    // Parse JSON data
    let data;
    try {
      data = JSON.parse(jsonData);
      console.log("📝 Master Selector data:", data);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON data" },
        { status: 400 }
      );
    }

    // Save uploaded image to ComfyUI input
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const comfyUIInputDir = '/home/nikhil/Documents/Remo2/ComfyUI/input';
    await mkdir(comfyUIInputDir, { recursive: true });
    
    const filename = `master_${Date.now()}_${imageFile.name}`;
    const filepath = path.join(comfyUIInputDir, filename);
    await writeFile(filepath, buffer);

    console.log("💾 Image saved to ComfyUI input:", filename);

    // Build the master prompt
    const buildMasterPrompt = () => {
      const parts = [`A photorealistic interior of a ${data.roomType || 'living_room'}`];
      
      if (data.masterToggles?.walls && data.masterSelector?.wallColor) {
        parts.push(`with ${data.masterSelector.wallColor} walls`);
      }
      if (data.masterToggles?.ceiling && data.masterSelector?.ceiling) {
        parts.push(`a ${data.masterSelector.ceiling} ceiling`);
      }
      if (data.masterToggles?.furniture && data.masterSelector?.furnitureStyle) {
        parts.push(`and ${data.masterSelector.furnitureStyle} furniture`);
      }
      if (data.masterToggles?.floor && data.masterSelector?.floorType) {
        parts.push(`on ${data.masterSelector.floorType} flooring`);
      }
      if (data.masterToggles?.lighting && data.masterSelector?.lighting) {
        parts.push(`with ${data.masterSelector.lighting} lighting`);
      }
      if (data.masterToggles?.decor && data.masterSelector?.decorStyle) {
        parts.push(`in ${data.masterSelector.decorStyle} style`);
      }

      return parts.join(', ') + ', professional interior photography, high resolution, detailed, realistic.';
    };

    const masterPrompt = buildMasterPrompt();
    console.log("🎨 Generated Master Prompt:", masterPrompt);

    // Create simplified workflow that works
    const workflow = {
      "prompt": {
        "1": {
          "inputs": {
            "ckpt_name": "sd_xl_base_1.0.safetensors"
          },
          "class_type": "CheckpointLoaderSimple"
        },
        "2": {
          "inputs": {
            "text": masterPrompt,
            "clip": ["1", 1]
          },
          "class_type": "CLIPTextEncode"
        },
        "3": {
          "inputs": {
            "text": "blurry, low quality, distorted, watermark, text, cartoon, anime, unrealistic, bad architecture",
            "clip": ["1", 1]
          },
          "class_type": "CLIPTextEncode"
        },
        "4": {
          "inputs": {
            "seed": Math.floor(Math.random() * 2147483647),
            "steps": data.settings?.num_inference_steps || 20,
            "cfg": data.settings?.guidance_scale || 7,
            "sampler_name": "dpmpp_2m",
            "scheduler": "karras",
            "denoise": 0.8,
            "model": ["1", 0],
            "positive": ["2", 0],
            "negative": ["3", 0],
            "latent_image": ["5", 0]
          },
          "class_type": "KSampler"
        },
        "5": {
          "inputs": {
            "width": 512,
            "height": 512,
            "batch_size": 1
          },
          "class_type": "EmptyLatentImage"
        },
        "6": {
          "inputs": {
            "samples": ["4", 0],
            "vae": ["1", 2]
          },
          "class_type": "VAEDecode"
        },
        "7": {
          "inputs": {
            "filename_prefix": `master-${data.generationMode || 'selective'}-${Date.now()}`,
            "images": ["6", 0]
          },
          "class_type": "SaveImage"
        }
      }
    };

    console.log("🚀 Submitting simplified workflow to ComfyUI...");

    const response = await axios.post('http://127.0.0.1:8188/prompt', {
      prompt: workflow.prompt
    }, {
      timeout: 10000
    });

    const promptId = response.data.prompt_id;
    console.log("🎯 Prompt ID:", promptId);

    if (!promptId) {
      return NextResponse.json(
        { 
          error: "Failed to start generation", 
          message: "No prompt ID received from ComfyUI"
        },
        { status: 500 }
      );
    }

    // Return immediately with the prompt ID (async processing)
    return NextResponse.json({
      success: true,
      message: "Master Selector generation started successfully",
      promptId: promptId,
      status: 'processing',
      estimatedTime: 25,
      generatedPrompt: masterPrompt,
      masterSelector: data.masterSelector,
      masterToggles: data.masterToggles,
      useArchAi3d: false, // Simplified for now
      mode: data.generationMode || 'selective',
      categoriesChanged: Object.keys(data.masterToggles || {}).filter(k => data.masterToggles[k]).length,
    });

  } catch (error: any) {
    console.error("❌ Master Selector API error:", error);
    return NextResponse.json(
      { 
        error: "Generation failed", 
        message: error.message,
        details: error.stack
      },
      { status: 500 }
    );
  }
}
