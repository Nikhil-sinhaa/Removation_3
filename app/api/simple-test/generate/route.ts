// app/api/simple-test/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import axios from "axios";

export async function POST(req: NextRequest) {
  try {
    console.log("🎯 Starting simple test generation...");
    
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

    console.log("📸 Image received:", imageFile.name, imageFile.size);

    // Parse JSON data
    let data;
    try {
      data = JSON.parse(jsonData);
      console.log("📝 Parsed data:", data);
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
    
    const filename = `test_${Date.now()}_${imageFile.name}`;
    const filepath = path.join(comfyUIInputDir, filename);
    await writeFile(filepath, buffer);

    console.log("💾 Image saved to ComfyUI input:", filename);

    // Create and submit workflow directly
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
            "text": `${data.prompt || 'modern room design'}, ${data.style || 'modern'} ${data.roomType || 'living room'} interior design, professional photography, high quality`,
            "clip": ["1", 1]
          },
          "class_type": "CLIPTextEncode"
        },
        "3": {
          "inputs": {
            "text": `${data.negative_prompt || 'blurry, distorted, low quality, watermark, text, cartoon, anime'}`,
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
            "denoise": 1.0,
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
            "filename_prefix": `simple-test-${data.mode || 'redesign'}-${data.style || 'modern'}-${Date.now()}`,
            "images": ["6", 0]
          },
          "class_type": "SaveImage"
        }
      }
    };

    console.log("🚀 Submitting workflow to ComfyUI...");

    const response = await axios.post('http://127.0.0.1:8188/prompt', {
      prompt: workflow.prompt
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

    // Wait for completion
    console.log("⏳ Waiting for generation...");
    const maxAttempts = 30;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        const statusResponse = await axios.get(`http://127.0.0.1:8188/history/${promptId}`);
        const history = statusResponse.data;
        const promptHistory = history[promptId];

        if (promptHistory) {
          if (promptHistory.status?.str === 'success') {
            console.log("✅ Generation completed!");
            
            // Find the output image
            const outputs = promptHistory.outputs;
            for (const nodeId in outputs) {
              const images = outputs[nodeId].images;
              if (images && images.length > 0) {
                const outputFilename = images[0].filename;
                console.log("🖼️ Generated:", outputFilename);
                
                // Copy to public folder
                const publicDir = path.join(process.cwd(), 'public', 'generated');
                await mkdir(publicDir, { recursive: true });
                
                const sourcePath = path.join('/home/nikhil/Documents/Remo2/ComfyUI/output', outputFilename);
                const publicFilename = `test_user_${outputFilename}`;
                const destPath = path.join(publicDir, publicFilename);
                
                try {
                  const fs = require('fs');
                  fs.copyFileSync(sourcePath, destPath);
                  console.log("✅ Image copied to public:", publicFilename);
                  
                  return NextResponse.json({
                    success: true,
                    message: "Generation completed successfully",
                    originalImage: filepath,
                    generatedImage: `/generated/${publicFilename}`,
                    processingTime: (attempt + 1) * 2000,
                    prompt: data.prompt || `${data.style} ${data.roomType} redesign`,
                    status: 'completed',
                  });
                } catch (copyError: any) {
                  console.error("Failed to copy image:", copyError);
                  return NextResponse.json(
                    { 
                      error: "Failed to copy generated image", 
                      message: copyError?.message || 'Unknown copy error'
                    },
                    { status: 500 }
                  );
                }
              }
            }
          } else if (promptHistory.status?.str === 'error') {
            console.log("❌ Generation failed");
            return NextResponse.json(
              { 
                error: "Generation failed", 
                message: promptHistory.status?.msg || 'Unknown error'
              },
              { status: 500 }
            );
          }
        }
        
        console.log(`📊 Progress: ${attempt + 1}/${maxAttempts}`);
      } catch (error) {
        console.error(`Error checking generation status (attempt ${attempt + 1}):`, error);
      }
    }

    return NextResponse.json(
      { 
        error: "Generation timed out", 
        message: "Generation took too long to complete"
      },
      { status: 500 }
    );

  } catch (error: any) {
    console.error("❌ Simple Test API error:", error);
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
