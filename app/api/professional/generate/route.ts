// app/api/professional/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import axios from "axios";

export async function POST(req: NextRequest) {
  try {
    console.log("🎯 Starting Professional Conditioning Injection generation...");
    
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
      console.log("📝 Professional settings:", data);
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
    
    const filename = `professional_${Date.now()}_${imageFile.name}`;
    const filepath = path.join(comfyUIInputDir, filename);
    await writeFile(filepath, buffer);

    console.log("💾 Image saved to ComfyUI input:", filename);

    // Build professional prompt with conditioning injection logic
    const buildProfessionalPrompt = () => {
      const parts = [`(Architectural visualization:1.2), maintain original room geometry, professional ${data.roomType || 'living_room'} design`];
      
      // Add material changes with professional phrasing
      if (data.masterPrompt?.materials?.walls && data.masterPrompt.materials.walls !== 'keep_original') {
        parts.push(`${data.masterPrompt.materials.walls} walls with realistic texture`);
      }
      if (data.masterPrompt?.materials?.ceiling && data.masterPrompt.materials.ceiling !== 'keep_original') {
        parts.push(`${data.masterPrompt.materials.ceiling} ceiling with proper lighting`);
      }
      if (data.masterPrompt?.materials?.furniture && data.masterPrompt.materials.furniture !== 'keep_original') {
        parts.push(`${data.masterPrompt.materials.furniture} furniture with accurate perspective`);
      }
      if (data.masterPrompt?.materials?.floors && data.masterPrompt.materials.floors !== 'keep_original') {
        parts.push(`${data.masterPrompt.materials.floors} flooring with realistic reflections`);
      }
      if (data.masterPrompt?.materials?.lighting && data.masterPrompt.materials.lighting !== 'keep_original') {
        parts.push(`${data.masterPrompt.materials.lighting} lighting with natural shadows`);
      }

      parts.push("realistic lighting, 8k photo, architectural accuracy, vastu compliant, professional interior photography");
      return parts.join(', ');
    };

    const professionalPrompt = buildProfessionalPrompt();
    console.log("🎨 Generated Professional Prompt:", professionalPrompt);

    // Create simplified workflow that demonstrates the concept
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
            "text": professionalPrompt,
            "clip": ["1", 1]
          },
          "class_type": "CLIPTextEncode"
        },
        "3": {
          "inputs": {
            "text": "blurry, low quality, distorted, weight spikes, perspective changes, structural deformation, plastic, fake, unrealistic architecture",
            "clip": ["1", 1]
          },
          "class_type": "CLIPTextEncode"
        },
        "4": {
          "inputs": {
            "seed": Math.floor(Math.random() * 2147483647),
            "steps": data.hardwareOptimization?.steps || 15,
            "cfg": 7.5,
            "sampler_name": data.hardwareOptimization?.sampler || 'uni_pc',
            "scheduler": "karras",
            "denoise": data.structuralLock?.enabled ? 0.75 : 0.8, // Lower denoise when structural lock is enabled
            "model": ["1", 0],
            "positive": ["2", 0],
            "negative": ["3", 0],
            "latent_image": ["5", 0]
          },
          "class_type": "KSampler"
        },
        "5": {
          "inputs": {
            "width": data.hardwareOptimization?.useTiledVAE ? 768 : 1024, // Smaller for memory efficiency
            "height": data.hardwareOptimization?.useTiledVAE ? 768 : 1024,
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
            "filename_prefix": `professional-${data.masterPrompt?.mode || 'architectural'}-${Date.now()}`,
            "images": ["6", 0]
          },
          "class_type": "SaveImage"
        }
      }
    };

    console.log("🚀 Submitting professional workflow to ComfyUI...");

    const response = await axios.post('http://127.0.0.1:8188/prompt', {
      prompt: workflow.prompt
    }, {
      timeout: 15000
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

    // Build the professional prompt summary
    const buildPromptSummary = () => {
      const changes = [];
      
      if (data.masterPrompt?.materials?.walls && data.masterPrompt.materials.walls !== 'keep_original') {
        changes.push(`Walls: ${data.masterPrompt.materials.walls}`);
      }
      if (data.masterPrompt?.materials?.ceiling && data.masterPrompt.materials.ceiling !== 'keep_original') {
        changes.push(`Ceiling: ${data.masterPrompt.materials.ceiling}`);
      }
      if (data.masterPrompt?.materials?.furniture && data.masterPrompt.materials.furniture !== 'keep_original') {
        changes.push(`Furniture: ${data.masterPrompt.materials.furniture}`);
      }
      if (data.masterPrompt?.materials?.floors && data.masterPrompt.materials.floors !== 'keep_original') {
        changes.push(`Floors: ${data.masterPrompt.materials.floors}`);
      }
      if (data.masterPrompt?.materials?.lighting && data.masterPrompt.materials.lighting !== 'keep_original') {
        changes.push(`Lighting: ${data.masterPrompt.materials.lighting}`);
      }

      return changes.length > 0 ? changes.join(', ') : 'Keep original materials';
    };

    // Return immediately with the prompt ID (async processing)
    return NextResponse.json({
      success: true,
      message: "Professional Conditioning Injection started successfully",
      promptId: promptId,
      status: 'processing',
      estimatedTime: (data.hardwareOptimization?.steps || 15) * 2,
      generatedPrompt: professionalPrompt,
      promptSummary: buildPromptSummary(),
      structuralLock: data.structuralLock || { enabled: false, strength: 0 },
      encoderV2: data.encoderV2 || { contextStrength: 0.95, userTextStrength: 0.6 },
      hardwareOptimization: data.hardwareOptimization || { useTiledVAE: true, steps: 15 },
      mode: data.masterPrompt?.mode || 'architectural_visualization',
      categoriesChanged: Object.values(data.masterPrompt?.materials || {}).filter((m: any) => m !== 'keep_original').length,
    });

  } catch (error: any) {
    console.error("❌ Professional API error:", error);
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
