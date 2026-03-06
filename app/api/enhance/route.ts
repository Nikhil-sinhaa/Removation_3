// app/api/enhance/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/User";
import { Render } from "@/lib/db/models/Render";
import { runReplicateModel } from "@/lib/ai/replicate";
import { isReplicateConfigured } from "@/lib/env";
import { z } from "zod";

const enhanceSchema = z.object({
  imageUrl: z.string().url(),
  projectId: z.string().optional(),
  enhanceType: z.enum([
    'upscale',
    'denoise',
    'sharpen',
    'color_correct',
    'hdr',
    'all'
  ]).default('all'),
  settings: z.object({
    scale: z.enum(['2x', '4x']).default('2x'),
    denoiseStrength: z.number().min(0).max(1).default(0.5),
    sharpnessLevel: z.number().min(0).max(100).default(50),
    colorEnhancement: z.boolean().default(true),
    faceEnhancement: z.boolean().default(false),
  }).optional(),
});

export async function POST(req: NextRequest) {
  try {
    if (!isReplicateConfigured()) {
      return NextResponse.json(
        { error: "AI service not configured", message: "Image enhancement service is not available." },
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
    const validatedData = enhanceSchema.parse(body);

    await connectToDatabase();

    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Enhancement costs 1 credit for 2x, 2 credits for 4x
    const creditsRequired = validatedData.settings?.scale === '4x' ? 2 : 1;

    if (user.credits < creditsRequired) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          message: `Enhancement requires ${creditsRequired} credit(s)`,
          creditsRequired,
          creditsAvailable: user.credits
        },
        { status: 402 }
      );
    }

    // Create render record
    const render = await Render.create({
      userId: user._id,
      clerkId: userId,
      projectId: validatedData.projectId,
      inputImage: validatedData.imageUrl,
      mode: 'enhance',
      settings: {
        enhanceType: validatedData.enhanceType,
        ...validatedData.settings,
      },
      status: 'processing',
    });

    // Deduct credits
    await User.findByIdAndUpdate(user._id, {
      $inc: { credits: -creditsRequired },
      $push: {
        creditHistory: {
          amount: -creditsRequired,
          type: 'enhance',
          description: `Image enhancement (${validatedData.settings?.scale || '2x'})`,
          createdAt: new Date(),
        }
      }
    });

    try {
      // Use Real-ESRGAN for upscaling
      const scale = validatedData.settings?.scale === '4x' ? 4 : 2;

      const result = await runReplicateModel({
        model: "nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa",
        input: {
          image: validatedData.imageUrl,
          scale,
          face_enhance: validatedData.settings?.faceEnhancement || false,
        },
      });

      // If color correction is enabled, apply additional processing
      let finalOutput = result.output;

      if (validatedData.settings?.colorEnhancement && validatedData.enhanceType !== 'upscale') {
        // Could add additional color correction step here
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
        enhancement: {
          type: validatedData.enhanceType,
          scale: validatedData.settings?.scale || '2x',
        },
        creditsUsed: creditsRequired,
        creditsRemaining: user.credits - creditsRequired,
      });

    } catch (error: any) {
      // Refund credits on failure
      await User.findByIdAndUpdate(user._id, {
        $inc: { credits: creditsRequired },
        $push: {
          creditHistory: {
            amount: creditsRequired,
            type: 'refund',
            description: 'Refund for failed enhancement',
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
    console.error("Enhance API error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Enhancement failed", message: error.message },
      { status: 500 }
    );
  }
}