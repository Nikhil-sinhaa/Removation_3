// app/api/demo/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { comfyUIBridge, GenerationRequest } from "@/lib/ai/comfyui-bridge";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// In-memory store for demo generations
const demoGenerations = new Map<string, {
  status: 'processing' | 'completed' | 'failed';
  outputImage?: string;
  error?: string;
  processingTime?: number;
}>();

export async function POST(req: NextRequest) {
  try {
    // Check ComfyUI health first
    const isHealthy = await comfyUIBridge.checkHealth();
    if (!isHealthy) {
      return NextResponse.json(
        { 
          error: "ComfyUI not running",
          message: "Please start ComfyUI first: cd ~/ComfyUI && python main.py --listen 127.0.0.1 --port 8188"
        },
        { status: 503 }
      );
    }

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

    // Save uploaded image
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const uploadsDir = path.join(process.cwd(), 'uploads');
    await mkdir(uploadsDir, { recursive: true });
    
    const filename = `demo_${Date.now()}_${imageFile.name}`;
    const filepath = path.join(uploadsDir, filename);
    await writeFile(filepath, buffer);

    // Generate unique ID
    const generationId = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    demoGenerations.set(generationId, { status: 'processing' });

    // Start generation
    const generationRequest: GenerationRequest = {
      image: filepath,
      prompt: data.prompt || `${data.style} ${data.roomType} redesign`,
      negative_prompt: data.negative_prompt,
      mode: data.mode,
      style: data.style,
      roomType: data.roomType,
      settings: data.settings,
      userId: "demo_user",
    };

    // Process and update status
    comfyUIBridge.generate(generationRequest).then((result) => {
      if (result.success && result.generatedImage) {
        demoGenerations.set(generationId, {
          status: 'completed',
          outputImage: result.generatedImage,
          processingTime: result.processingTime,
        });
      } else {
        demoGenerations.set(generationId, {
          status: 'failed',
          error: result.error || 'Generation failed',
        });
      }
    }).catch((error) => {
      demoGenerations.set(generationId, {
        status: 'failed',
        error: error.message,
      });
    });

    return NextResponse.json({
      success: true,
      message: "Generation started",
      generationId,
      estimatedTime: 25,
    });

  } catch (error: any) {
    console.error("Demo Generate API error:", error);
    return NextResponse.json(
      { error: "Generation failed", message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const generationId = searchParams.get('id');

  if (!generationId) {
    return NextResponse.json(
      { error: "No generation ID provided" },
      { status: 400 }
    );
  }

  const generation = demoGenerations.get(generationId);
  
  if (!generation) {
    return NextResponse.json(
      { error: "Generation not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(generation);
}
