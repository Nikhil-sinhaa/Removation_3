// app/api/working/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import axios from "axios";
import { createInteriorDesignWorkflow, getArchitecturalSettings, buildArchitecturalPrompt } from "@/lib/ai/comfyui-workflows";

export async function POST(req: NextRequest) {
  try {
    console.log("🎯 Starting WORKING generation with ControlNet...");
    
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
    
    const filename = `working_${Date.now()}_${imageFile.name}`;
    const filepath = path.join(comfyUIInputDir, filename);
    await writeFile(filepath, buffer);

    console.log("💾 Image saved to ComfyUI input:", filename);

    // Build architectural prompt if requested
    const useArchitectural = data.settings?.architecturalMode || data.settings?.preserveLayout;
    let prompt = data.prompt;
    
    if (useArchitectural) {
      prompt = buildArchitecturalPrompt({
        mode: data.mode || 'redesign',
        style: data.style || 'modern',
        roomType: data.roomType || 'living_room',
        customPrompt: data.prompt || '',
        materials: data.settings?.materials || [],
        preserveElements: data.settings?.preserveElements || []
      });
      console.log("🏛️ Using architectural prompt:", prompt);
    }

    // Get architectural settings (enables ControlNet with Canny)
    const settings = useArchitectural 
      ? getArchitecturalSettings(data.settings)
      : data.settings;

    // Create img2img workflow with ControlNet for structural locking
    const workflow = createInteriorDesignWorkflow({
      mode: data.mode || 'redesign',
      style: data.style || 'modern',
      roomType: data.roomType || 'living_room',
      prompt: prompt,
      negativePrompt: data.negative_prompt || 'blurry, low quality, watermark, distorted architecture',
      imageName: filename,
      settings: settings,
      seed: Math.floor(Math.random() * 2147483647)
    });

    console.log("🚀 Submitting to ComfyUI with ControlNet...");
    console.log("🎨 ControlNet strength:", settings.controlnetStrength || 'disabled');

    // Submit to ComfyUI
    const response = await axios.post('http://127.0.0.1:8188/prompt', {
      prompt: workflow
    }, {
      timeout: 10000  // 10 second timeout
    });

    const promptId = response.data.prompt_id;
    console.log("🎯 Prompt ID:", promptId);

    if (!promptId) {
      return NextResponse.json(
        { error: "Failed to start generation" },
        { status: 500 }
      );
    }

    // Return immediately with the prompt ID (async processing)
    return NextResponse.json({
      success: true,
      message: "Generation started successfully",
      promptId: promptId,
      status: 'processing',
      estimatedTime: 15, // seconds
    });

  } catch (error: any) {
    console.error("❌ Working API error:", error);
    return NextResponse.json(
      { 
        error: "Generation failed", 
        message: error.message
      },
      { status: 500 }
    );
  }
}
