// app/api/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from '@/lib/auth/jwt';
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/User";
import { Render } from "@/lib/db/models/Render";
import { Project } from "@/lib/db/models/Project";
import { generateWithComfyUI, getModelForMode } from "@/lib/ai/comfyui";
import { generatePrompt } from "@/lib/ai/prompts";
import { analyzeImageWithGroq } from "@/lib/ai/groq";
import { z } from "zod";

const generateSchema = z.object({
  imageUrl: z.string().url(),
  projectId: z.string().optional(),
  mode: z.enum([
    'redesign',
    'beautify',
    'creative',
    'furnish',
    'empty',
    'outdoor',
    'sketch',
    'enhance'
  ]),
  style: z.string(),
  roomType: z.string(),
  settings: z.object({
    creativity: z.number().min(0).max(100).default(50),
    preserveLayout: z.boolean().default(true),
    enhanceQuality: z.boolean().default(true),
    colorScheme: z.string().optional(),
    materials: z.array(z.string()).optional(),
    lighting: z.enum(['natural', 'warm', 'cool', 'dramatic']).optional(),
    timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'night']).optional(),
  }).optional(),
  customPrompt: z.string().optional(),
  referenceImages: z.array(z.string().url()).optional(),
  numberOfVariations: z.number().min(1).max(4).default(1),
});

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

    const body = await req.json();
    const validatedData = generateSchema.parse(body);

    await connectToDatabase();

    // Check user credits
    const user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found", message: "Please complete your registration" },
        { status: 404 }
      );
    }

    const creditsRequired = validatedData.numberOfVariations;
    
    if (user.credits < creditsRequired) {
      return NextResponse.json(
        { 
          error: "Insufficient credits", 
          message: `You need ${creditsRequired} credits but have ${user.credits}`,
          creditsRequired,
          creditsAvailable: user.credits
        },
        { status: 402 }
      );
    }

    // Analyze the input image for better prompt generation
    let imageAnalysis = null;
    try {
      imageAnalysis = await analyzeImageWithGroq(validatedData.imageUrl);
    } catch (error) {
      console.log("Image analysis skipped:", error);
    }

    // Generate the prompt
    const prompt = generatePrompt({
      mode: validatedData.mode,
      style: validatedData.style,
      roomType: validatedData.roomType,
      settings: validatedData.settings,
      customPrompt: validatedData.customPrompt,
      imageAnalysis,
    });

    // Get the appropriate model based on mode
    const model = getModelForMode(validatedData.mode);

    // Create render records for tracking
    const renderPromises = [];
    const renderIds: string[] = [];

    for (let i = 0; i < validatedData.numberOfVariations; i++) {
      const render = await Render.create({
        userId: user._id,
        projectId: validatedData.projectId,
        inputImage: validatedData.imageUrl,
        mode: validatedData.mode,
        style: validatedData.style,
        roomType: validatedData.roomType,
        prompt,
        settings: validatedData.settings,
        status: 'processing',
        variationIndex: i,
      });
      
      renderIds.push(render._id.toString());

      // Generate with ComfyUI
      const generatePromise = generateWithComfyUI({
        image: validatedData.imageUrl,
        prompt,
        negative_prompt: "blurry, distorted, low quality, watermark, text, unrealistic, cartoon, anime, illustration, oversaturated",
        mode: validatedData.mode,
        style: validatedData.style,
        roomType: validatedData.roomType,
        settings: {
          creativity: validatedData.settings?.creativity || 50,
          preserveLayout: validatedData.settings?.preserveLayout,
          enhanceQuality: validatedData.settings?.enhanceQuality,
          colorScheme: validatedData.settings?.colorScheme,
          materials: validatedData.settings?.materials,
          lighting: validatedData.settings?.lighting,
          timeOfDay: validatedData.settings?.timeOfDay,
          num_inference_steps: validatedData.mode === 'enhance' ? 50 : 30,
          guidance_scale: 7 + (validatedData.settings?.creativity || 50) / 20,
          strength: validatedData.settings?.preserveLayout ? 0.6 : 0.85,
        },
        seed: Math.floor(Math.random() * 2147483647) + i * 1000,
      }).then(async (result) => {
        // Update render with completed result
        await Render.findByIdAndUpdate(render._id, {
          status: 'completed',
          outputImage: result.output,
          processingTime: result.processingTime,
          completedAt: new Date(),
          workflow: result.workflow
        });
        
        return {
          renderId: render._id.toString(),
          output: result.output,
          processingTime: result.processingTime
        };
      }).catch(async (error) => {
        // Update render with error
        await Render.findByIdAndUpdate(render._id, {
          status: 'failed',
          error: error.message,
          completedAt: new Date()
        });
        
        throw error;
      });

      renderPromises.push(generatePromise);
    }

    // Deduct credits immediately
    await User.findByIdAndUpdate(user._id, {
      $inc: { credits: -creditsRequired },
      $push: { 
        creditHistory: {
          amount: -creditsRequired,
          type: 'generation',
          description: `Generated ${creditsRequired} ${validatedData.mode} render(s)`,
          createdAt: new Date(),
        }
      }
    });

    // Start generation (don't await - let webhook handle completion)
    Promise.all(renderPromises).catch(async (error) => {
      console.error("Generation failed:", error);
      
      // Refund credits on failure
      await User.findByIdAndUpdate(user._id, {
        $inc: { credits: creditsRequired },
        $push: { 
          creditHistory: {
            amount: creditsRequired,
            type: 'refund',
            description: 'Refund for failed generation',
            createdAt: new Date(),
          }
        }
      });

      // Update render status
      await Render.updateMany(
        { _id: { $in: renderIds } },
        { 
          status: 'failed',
          error: error.message,
          completedAt: new Date()
        }
      );
    });

    // Update project if provided
    if (validatedData.projectId) {
      await Project.findByIdAndUpdate(validatedData.projectId, {
        $push: { renders: { $each: renderIds } },
        lastActivity: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      message: "Generation started",
      renderIds,
      creditsUsed: creditsRequired,
      creditsRemaining: user.credits - creditsRequired,
      estimatedTime: validatedData.numberOfVariations * 15, // seconds
    });

  } catch (error: any) {
    console.error("Generate API error:", error);
    
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