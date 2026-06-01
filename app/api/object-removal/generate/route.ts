// app/api/object-removal/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import axios from "axios";
import { createOptimizedObjectRemovalWorkflow, ObjectRemovalRequest } from "@/lib/ai/comfyui-workflows-object-removal";
import { connectDB } from '@/lib/db/mongodb';
import { getCurrentUser } from '@/lib/auth/jwt';
import { checkAndDeductCredits } from '@/lib/ai/deductCredits';

export async function POST(req: NextRequest) {
  await connectDB();
  try {
    const authUser = await getCurrentUser();
    if (!authUser || !authUser.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const finalUserId = authUser.id;

    const deductResult = await checkAndDeductCredits(finalUserId, 'remove-object');
    if (!deductResult.success) {
      return NextResponse.json({
        error: 'insufficient_credits',
        message: deductResult.reason,
        remainingCredits: deductResult.remaining,
        upgradeUrl: '/pricing'
      }, { status: 402 });
    }

    console.log("🗑️ Starting Object Removal generation...");
    
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
      console.log("📝 Object Removal data:", data);
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
    
    const filename = `object_removal_${Date.now()}_${imageFile.name}`;
    const filepath = path.join(comfyUIInputDir, filename);
    await writeFile(filepath, buffer);

    console.log("💾 Image saved to ComfyUI input:", filename);

    // Create Object Removal Request
    const objectRemovalRequest: ObjectRemovalRequest = {
      image: filepath,
      prompt: data.prompt || `Object removal for ${data.roomType || 'room'}`,
      negative_prompt: data.negative_prompt || "blurry, low quality, distorted, artifacts, seams",
      mode: data.mode || 'object_removal',
      style: data.style || 'professional',
      roomType: data.roomType || 'living_room',
      settings: data.settings || {
        method: 'professional',
        creativity: 50,
        num_inference_steps: 15,
        guidance_scale: 7.5,
      },
      userId: finalUserId,
      removalMethod: data.removalMethod || 'lama',
      maskData: data.maskData || {
        coordinates: { x: 100, y: 100, width: 200, height: 150 },
        autoDetect: data.removalMethod === 'sam2'
      },
      replacementPrompt: data.replacementPrompt || "clean empty space, minimalist room, seamless background",
    };

    console.log("🗑️ Removal Method:", objectRemovalRequest.removalMethod);
    console.log("🎭 Mask Data:", objectRemovalRequest.maskData);
    console.log("⚙️ Settings:", objectRemovalRequest.settings);

    // Create optimized workflow for 8GB VRAM
    const workflow = createOptimizedObjectRemovalWorkflow(objectRemovalRequest);

    console.log("🚀 Submitting object removal workflow to ComfyUI...");

    const comfyUrl = process.env.COMFYUI_URL || 'http://127.0.0.1:8188';
    const response = await axios.post(`${comfyUrl}/prompt`, {
      prompt: workflow.prompt
    }, {
      timeout: 12000
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

    // Build method-specific response
    const getMethodInfo = () => {
      switch (objectRemovalRequest.removalMethod) {
        case 'lama':
          return {
            name: 'LaMa (Large Mask Inpainting)',
            description: 'Fast and stable method, intelligently fills gaps with surrounding textures',
            benefits: ['Lightweight model', 'Rarely crashes GPU', 'Extends floor/wall textures'],
            estimatedTime: 10
          };
        case 'flux_fill':
          return {
            name: 'Flux.1 Fill / SDXL Inpaint',
            description: 'High-end method that re-imagines space behind removed object',
            benefits: ['Creative replacement', 'Professional quality', 'Prompt-based generation'],
            estimatedTime: 25
          };
        case 'sam2':
          return {
            name: 'Segment Anything 2 + LaMa',
            description: 'Autonomous method with perfect object boundary detection',
            benefits: ['Automatic detection', 'No manual masking', 'Perfect boundaries'],
            estimatedTime: 15
          };
        default:
          return {
            name: 'LaMa (Default)',
            description: 'Fast and stable object removal',
            benefits: ['Lightweight', 'Fast', 'Reliable'],
            estimatedTime: 10
          };
      }
    };

    const methodInfo = getMethodInfo();

    // Return immediately with prompt ID (async processing)
    return NextResponse.json({
      success: true,
      message: `${methodInfo.name} started successfully`,
      promptId: promptId,
      status: 'processing',
      estimatedTime: methodInfo.estimatedTime,
      method: objectRemovalRequest.removalMethod,
      methodInfo: methodInfo,
      maskData: objectRemovalRequest.maskData,
      replacementPrompt: objectRemovalRequest.replacementPrompt,
      settings: objectRemovalRequest.settings,
    });

  } catch (error: any) {
    console.error("❌ Object Removal API error:", error);
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
