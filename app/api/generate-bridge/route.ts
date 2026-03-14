// app/api/generate-bridge/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from '@/lib/auth/jwt';
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/User";
import { Render } from "@/lib/db/models/Render";
import { comfyUIBridge, GenerationRequest } from "@/lib/ai/comfyui-bridge";
import { z } from "zod";
import multer from "multer";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const generateSchema = z.object({
  mode: z.enum(['redesign', 'beautify', 'creative', 'furnish', 'empty', 'outdoor', 'sketch', 'enhance']),
  style: z.string(),
  roomType: z.string(),
  prompt: z.string().optional(),
  negative_prompt: z.string().optional(),
  settings: z.object({
    creativity: z.number().min(0).max(100).default(50),
    preserveLayout: z.boolean().default(true),
    enhanceQuality: z.boolean().default(true),
    colorScheme: z.string().optional(),
    materials: z.array(z.string()).optional(),
    lighting: z.enum(['natural', 'warm', 'cool', 'dramatic']).optional(),
    timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'night']).optional(),
    num_inference_steps: z.number().min(10).max(50).default(25),
    guidance_scale: z.number().min(1).max(20).default(7),
    strength: z.number().min(0.1).max(1.0).default(0.6),
  }).optional(),
});

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

export async function POST(req: NextRequest) {
  try {
    const authUser = await getCurrentUser();
    const userId = authUser?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Please sign in to continue" },
        { status: 401 }
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

    // Parse and validate JSON data
    let data;
    try {
      data = JSON.parse(jsonData);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON data" },
        { status: 400 }
      );
    }

    const validatedData = generateSchema.parse(data);

    await connectToDatabase();

    // Check user credits
    const user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found", message: "Please complete your registration" },
        { status: 404 }
      );
    }

    if (user.credits < 1) {
      return NextResponse.json(
        { 
          error: "Insufficient credits", 
          message: "You need at least 1 credit to generate a design",
          creditsRequired: 1,
          creditsAvailable: user.credits
        },
        { status: 402 }
      );
    }

    // Save uploaded image
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const uploadsDir = path.join(process.cwd(), 'uploads');
    await mkdir(uploadsDir, { recursive: true });
    
    const filename = `${userId}_${Date.now()}_${imageFile.name}`;
    const filepath = path.join(uploadsDir, filename);
    await writeFile(filepath, buffer);

    // Create render record
    const render = await Render.create({
      userId: user._id,
      clerkId: userId,
      inputImage: filepath,
      originalImagePath: filepath,
      mode: validatedData.mode,
      style: validatedData.style,
      roomType: validatedData.roomType,
      prompt: validatedData.prompt || `${validatedData.style} ${validatedData.roomType} redesign`,
      settings: validatedData.settings,
      status: 'processing',
      variationIndex: 0,
    });

    // Deduct credit
    await User.findByIdAndUpdate(user._id, {
      $inc: { credits: -1 },
      $push: { 
        creditHistory: {
          amount: -1,
          type: 'generation',
          description: `Generated ${validatedData.mode} render`,
          createdAt: new Date(),
        }
      }
    });

    // Start generation with ComfyUI
    try {
      const generationRequest: GenerationRequest = {
        image: filepath,
        prompt: validatedData.prompt || `${validatedData.style} ${validatedData.roomType} redesign`,
        negative_prompt: validatedData.negative_prompt,
        mode: validatedData.mode,
        style: validatedData.style,
        roomType: validatedData.roomType,
        settings: validatedData.settings,
        userId: userId,
      };

      // Process in background
      comfyUIBridge.generate(generationRequest).then(async (result) => {
        if (result.success && result.generatedImage) {
          await Render.findByIdAndUpdate(render._id, {
            status: 'completed',
            outputImage: result.generatedImage,
            generatedImagePath: result.generatedImage,
            processingTime: result.processingTime,
            completedAt: new Date(),
          });
        } else {
          await Render.findByIdAndUpdate(render._id, {
            status: 'failed',
            error: result.error,
            completedAt: new Date(),
          });

          // Refund credit on failure
          await User.findByIdAndUpdate(user._id, {
            $inc: { credits: 1 },
            $push: { 
              creditHistory: {
                amount: 1,
                type: 'refund',
                description: 'Refund for failed generation',
                createdAt: new Date(),
              }
            }
          });
        }
      }).catch(async (error) => {
        console.error('ComfyUI generation failed:', error);
        await Render.findByIdAndUpdate(render._id, {
          status: 'failed',
          error: error.message,
          completedAt: new Date(),
        });
      });

    } catch (error) {
      console.error('Failed to start ComfyUI generation:', error);
      await Render.findByIdAndUpdate(render._id, {
        status: 'failed',
        error: 'Failed to start generation',
        completedAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      message: "Generation started",
      renderId: render._id.toString(),
      creditsUsed: 1,
      creditsRemaining: user.credits - 1,
      estimatedTime: 25, // seconds
    });

  } catch (error: any) {
    console.error("Generate Bridge API error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Generation failed", message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const authUser = await getCurrentUser();
    const userId = authUser?.id;
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const renderId = searchParams.get('renderId');

    await connectToDatabase();

    const user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (renderId) {
      const render = await Render.findOne({ 
        _id: renderId, 
        userId: user._id 
      });

      if (!render) {
        return NextResponse.json({ error: "Render not found" }, { status: 404 });
      }

      return NextResponse.json({ render });
    }

    // Get recent renders
    const renders = await Render.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    return NextResponse.json({ renders });

  } catch (error: any) {
    console.error("Get renders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch renders", message: error.message },
      { status: 500 }
    );
  }
}
