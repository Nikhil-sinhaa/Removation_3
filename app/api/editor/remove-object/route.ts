import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, readFile } from "fs/promises";
import path from "path";
import axios from "axios";
import fs from "fs";

// ComfyUI base URL
const COMFYUI_URL = process.env.COMFYUI_URL || "http://127.0.0.1:8188";

interface ComfyUIWorkflow {
  [key: string]: {
    inputs: Record<string, any>;
    class_type: string;
  };
}

// Create LaMa object removal workflow
function createObjectRemovalWorkflow(
  imageFilename: string,
  maskFilename: string
): ComfyUIWorkflow {
  return {
    "1": {
      "inputs": {
        "image": imageFilename,
        "upload": "image"
      },
      "class_type": "LoadImage"
    },
    "2": {
      "inputs": {
        "image": maskFilename,
        "upload": "image"
      },
      "class_type": "LoadImage"
    },
    "3": {
      "inputs": {
        "images": ["1", 0],
        "masks": ["2", 0],
        "mask_threshold": 250,
        "gaussblur_radius": 8,
        "invert_mask": false
      },
      "class_type": "LamaRemoverIMG"
    },
    "4": {
      "inputs": {
        "filename_prefix": `object-removed-${Date.now()}`,
        "images": ["3", 0]
      },
      "class_type": "SaveImage"
    }
  };
}

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, maskBase64 } = await req.json();

    if (!imageBase64 || !maskBase64) {
      return NextResponse.json(
        { error: "Image and mask are required" },
        { status: 400 }
      );
    }

    // Save images to ComfyUI input directory
    const comfyUIInputDir = "/home/nikhil/Documents/Remo2/ComfyUI/input";
    const timestamp = Date.now();
    const imageFilename = `obj_remove_img_${timestamp}.png`;
    const maskFilename = `obj_remove_mask_${timestamp}.png`;
    
    const imagePath = path.join(comfyUIInputDir, imageFilename);
    const maskPath = path.join(comfyUIInputDir, maskFilename);

    // Decode and save base64 images
    const imageBuffer = Buffer.from(imageBase64.split(',')[1] || imageBase64, 'base64');
    const maskBuffer = Buffer.from(maskBase64.split(',')[1] || maskBase64, 'base64');
    
    await writeFile(imagePath, imageBuffer);
    await writeFile(maskPath, maskBuffer);

    console.log("✅ Images saved to ComfyUI input:", imageFilename, maskFilename);

    // Create and submit workflow
    const workflow = createObjectRemovalWorkflow(imageFilename, maskFilename);
    
    const response = await axios.post(`${COMFYUI_URL}/prompt`, {
      prompt: workflow
    }, {
      timeout: 30000
    });

    const promptId = response.data.prompt_id;
    
    if (!promptId) {
      return NextResponse.json(
        { error: "Failed to start ComfyUI workflow" },
        { status: 500 }
      );
    }

    console.log("🎯 Object removal workflow started:", promptId);

    // Poll for completion
    const result = await waitForCompletion(promptId);
    
    if (result.success && result.filename) {
      // Copy result to public directory
      const outputDir = "/home/nikhil/Documents/Remo2/ComfyUI/output";
      const publicDir = path.join(process.cwd(), "public", "generated");
      
      await mkdir(publicDir, { recursive: true });
      
      const sourcePath = path.join(outputDir, result.filename);
      const publicFilename = `removed_${timestamp}_${result.filename}`;
      const publicPath = path.join(publicDir, publicFilename);
      
      // Wait a moment for file to be written
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (fs.existsSync(sourcePath)) {
        const imageData = await readFile(sourcePath);
        await writeFile(publicPath, imageData);
        
        const imageUrl = `/generated/${publicFilename}`;
        
        return NextResponse.json({
          success: true,
          imageUrl,
          message: "Object removed successfully using LaMa"
        });
      } else {
        return NextResponse.json(
          { error: "Output file not found" },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: result.error || "Object removal failed" },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error("Object removal error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

async function waitForCompletion(promptId: string): Promise<{ success: boolean; filename?: string; error?: string }> {
  const maxAttempts = 60; // 2 minutes max
  const checkInterval = 2000; // 2 seconds
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await axios.get(`${COMFYUI_URL}/history/${promptId}`, {
        timeout: 5000
      });
      
      const history = response.data;
      const promptHistory = history[promptId];
      
      if (promptHistory) {
        if (promptHistory.status?.str === 'success') {
          // Find output image
          const outputs = promptHistory.outputs;
          for (const nodeId in outputs) {
            const images = outputs[nodeId].images;
            if (images && images.length > 0) {
              return {
                success: true,
                filename: images[0].filename
              };
            }
          }
          return { success: false, error: "No output images found" };
        } else if (promptHistory.status?.str === 'error') {
          return {
            success: false,
            error: promptHistory.status?.msg || 'LaMa processing failed'
          };
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    } catch (error) {
      console.error(`Status check error (attempt ${attempt + 1}):`, error);
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
  }
  
  return { success: false, error: "Object removal timed out" };
}
