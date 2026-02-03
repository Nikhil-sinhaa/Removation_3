// app/api/inpaint/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/User";
import { Render } from "@/lib/db/models/Render";
import { runReplicateModel } from "@/lib/ai/replicate";
import { z } from "zod";

const inpaintSchema = z.object({
  imageUrl: z.string().url(),
  maskUrl: z.string().url(),
  prompt: z.string().min(1).max(500),
  negativePrompt: z.string().optional(),
  projectId: z.string().optional(),
  settings: z.object({
    strength: z.number().min(0).max(1).default(0.8),
    guidanceScale: z.number().min(1).max(20).default(7.5),
    numInferenceSteps: z.number().min(10).max(50).default(30),
    preserveBackground: z.boolean().default(true),
  }).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = inpaintSchema.parse(body);

    await connectToDatabase();

    const user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Inpainting costs 1 credit
    if (user.credits < 1) {
      return NextResponse.json(
        { 
          error: "Insufficient credits",
          message: "Inpainting requires 1 credit",
          creditsRequired: 1,
          creditsAvailable: user.credits 
        },
        { status: 402 }
      );
    }

    // Create render record
    const render = await Render.create({
      userId: user._id,
      projectId: validatedData.projectId,
      inputImage: validatedData.imageUrl,
      maskImage: validatedData.maskUrl,
      mode: 'inpaint',
      prompt: validatedData.prompt,
      settings: validatedData.settings,
      status: 'processing',
    });

    // Deduct credit
    await User.findByIdAndUpdate(user._id, {
      $inc: { credits: -1 },
      $push: { 
        creditHistory: {
          amount: -1,
          type: 'inpaint',
          description: 'Inpainting operation',
          createdAt: new Date(),
        }
      }
    });

    // Run inpainting model
    try {
      const result = await runReplicateModel({
        model: "stability-ai/sdxl-inpainting:95b7223104132402a9ae91cc677285bc5eb997834bd2349fa486f53910fd68b3",
        input: {
          image: validatedData.imageUrl,
          mask: validatedData.maskUrl,
          prompt: validatedData.prompt,
          negative_prompt: validatedData.negativePrompt || "blurry, distorted, low quality, watermark, text",
          strength: validatedData.settings?.strength || 0.8,
          guidance_scale: validatedData.settings?.guidanceScale || 7.5,
          num_inference_steps: validatedData.settings?.numInferenceSteps || 30,
        },
      });

      // Update render with result
      await Render.findByIdAndUpdate(render._id, {
        outputImage: result.output,
        status: 'completed',
        completedAt: new Date(),
        processingTime: Date.now() - render.createdAt.getTime(),
      });

      return NextResponse.json({
        success: true,
        renderId: render._id.toString(),
        outputImage: result.output,
        creditsUsed: 1,
        creditsRemaining: user.credits - 1,
      });

    } catch (error: any) {
      // Refund credit on failure
      await User.findByIdAndUpdate(user._id, {
        $inc: { credits: 1 },
        $push: { 
          creditHistory: {
            amount: 1,
            type: 'refund',
            description: 'Refund for failed inpainting',
            createdAt: new Date(),
          }
        }
      });

      // Update render status
      await Render.findByIdAndUpdate(render._id, {
        status: 'failed',
        error: error.message,
        completedAt: new Date(),
      });

      throw error;
    }

  } catch (error: any) {
    console.error("Inpaint API error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Inpainting failed", message: error.message },
      { status: 500 }
    );
  }
}