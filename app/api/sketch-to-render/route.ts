// app/api/sketch-to-render/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/User";
import { Render } from "@/lib/db/models/Render";
import { runReplicateModel } from "@/lib/ai/replicate";
import { isReplicateConfigured } from "@/lib/env";
import { generateSketchPrompt } from "@/lib/ai/prompts";
import { z } from "zod";

const sketchToRenderSchema = z.object({
  sketchUrl: z.string().url(),
  roomType: z.string(),
  style: z.string(),
  projectId: z.string().optional(),
  description: z.string().optional(),
  settings: z.object({
    detailLevel: z.enum(['concept', 'detailed', 'photorealistic']).default('photorealistic'),
    colorScheme: z.string().optional(),
    materials: z.array(z.string()).optional(),
    lighting: z.enum(['natural', 'warm', 'cool', 'dramatic']).default('natural'),
    timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'night']).default('afternoon'),
    sketchFidelity: z.number().min(0).max(100).default(70),
  }).optional(),
});

export async function POST(req: NextRequest) {
  try {
    if (!isReplicateConfigured()) {
      return NextResponse.json(
        { error: "AI service not configured", message: "Sketch-to-render service is not available." },
        { status: 503 }
      );
    }

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = sketchToRenderSchema.parse(body);

    await connectToDatabase();

    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Sketch to render costs 3 credits (complex operation)
    if (user.credits < 3) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          message: "Sketch to render requires 3 credits",
          creditsRequired: 3,
          creditsAvailable: user.credits
        },
        { status: 402 }
      );
    }

    // Generate prompt for sketch rendering
    const prompt = generateSketchPrompt({
      roomType: validatedData.roomType,
      style: validatedData.style,
      description: validatedData.description,
      settings: validatedData.settings,
    });

    // Create render record
    const render = await Render.create({
      userId: user._id,
      clerkId: userId,
      projectId: validatedData.projectId,
      inputImage: validatedData.sketchUrl,
      mode: 'sketch_to_render',
      style: validatedData.style,
      roomType: validatedData.roomType,
      prompt,
      settings: validatedData.settings,
      status: 'processing',
    });

    // Deduct credits
    await User.findByIdAndUpdate(user._id, {
      $inc: { credits: -3 },
      $push: {
        creditHistory: {
          amount: -3,
          type: 'sketch_to_render',
          description: 'Sketch to photorealistic render',
          createdAt: new Date(),
        }
      }
    });

    try {
      // Determine conditioning scale based on fidelity setting
      const fidelity = validatedData.settings?.sketchFidelity || 70;
      const conditioningScale = 0.5 + (fidelity / 100) * 0.5;

      // Use ControlNet Scribble for sketch interpretation
      const result = await runReplicateModel({
        model: "jagilley/controlnet-scribble:435061a1b5a4c1e26740464bf786efdfa9cb3a3ac488595a2de23e143fdb0117",
        input: {
          image: validatedData.sketchUrl,
          prompt,
          negative_prompt: "sketch lines, pencil marks, unfinished, draft, wireframe, low quality, blurry",
          num_inference_steps: 40,
          guidance_scale: 8.5,
          controlnet_conditioning_scale: conditioningScale,
        },
      });

      // Optionally enhance the result for photorealism
      let finalOutput = result.output;

      if (validatedData.settings?.detailLevel === 'photorealistic') {
        // Could add an upscaling/enhancement step here
      }

      // Update render with result
      await Render.findByIdAndUpdate(render._id, {
        outputImage: finalOutput,
        status: 'completed',
        completedAt: new Date(),
        processingTime: Date.now() - render.createdAt.getTime(),
      });

      return NextResponse.json({
        success: true,
        renderId: render._id.toString(),
        outputImage: finalOutput,
        renderDetails: {
          style: validatedData.style,
          roomType: validatedData.roomType,
          detailLevel: validatedData.settings?.detailLevel || 'photorealistic',
        },
        creditsUsed: 3,
        creditsRemaining: user.credits - 3,
      });

    } catch (error: any) {
      // Refund credits on failure
      await User.findByIdAndUpdate(user._id, {
        $inc: { credits: 3 },
        $push: {
          creditHistory: {
            amount: 3,
            type: 'refund',
            description: 'Refund for failed sketch render',
            createdAt: new Date(),
          }
        }
      });

      await Render.findByIdAndUpdate(render._id, {
        status: 'failed',
        error: error.message,
        completedAt: new Date(),
      });

      throw error;
    }

  } catch (error: any) {
    console.error("Sketch to render API error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Sketch rendering failed", message: error.message },
      { status: 500 }
    );
  }
}