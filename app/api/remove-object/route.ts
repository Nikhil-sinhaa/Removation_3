// app/api/remove-object/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from '@/lib/auth/jwt';
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/User";
import { Render } from "@/lib/db/models/Render";
import { runReplicateModel } from "@/lib/ai/replicate";
import { z } from "zod";

const removeObjectSchema = z.object({
  imageUrl: z.string().url(),
  maskUrl: z.string().url().optional(),
  objectDescription: z.string().min(1).max(200).optional(),
  projectId: z.string().optional(),
  useAutoDetect: z.boolean().default(false),
  settings: z.object({
    fillMethod: z.enum(['smart', 'generative', 'clone']).default('smart'),
    preserveBackground: z.boolean().default(true),
  }).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const authUser = await getCurrentUser();
  const userId = authUser?.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = removeObjectSchema.parse(body);

    await connectToDatabase();

    const user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Object removal costs 1 credit
    if (user.credits < 1) {
      return NextResponse.json(
        { 
          error: "Insufficient credits",
          message: "Object removal requires 1 credit",
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
      mode: 'remove_object',
      prompt: validatedData.objectDescription || 'Remove selected object',
      settings: validatedData.settings,
      status: 'processing',
    });

    // Deduct credit
    await User.findByIdAndUpdate(user._id, {
      $inc: { credits: -1 },
      $push: { 
        creditHistory: {
          amount: -1,
          type: 'remove_object',
          description: 'Object removal operation',
          createdAt: new Date(),
        }
      }
    });

    try {
      let result;

      if (validatedData.maskUrl) {
        // Use LaMa for inpainting with provided mask
        result = await runReplicateModel({
          model: "stability-ai/sdxl-inpainting:95b7223104132402a9ae91cc677285bc5eb997834bd2349fa486f53910fd68b3",
          input: {
            image: validatedData.imageUrl,
            mask: validatedData.maskUrl,
            prompt: "empty clean background, seamless, natural looking floor/wall continuation",
            negative_prompt: "object, furniture, item, artifact, blur, distortion",
            num_inference_steps: 30,
            guidance_scale: 7.5,
          },
        });
      } else if (validatedData.objectDescription) {
        // Use instruction-based removal
        result = await runReplicateModel({
          model: "timothybrooks/instruct-pix2pix:30c1d0b916a6f8efce20493f5d61ee27491ab2a60437c13c588468b9810ec23f",
          input: {
            image: validatedData.imageUrl,
            prompt: `Remove the ${validatedData.objectDescription}, leaving clean empty space, natural background continuation`,
            negative_prompt: "object remaining, artifact, blur, distortion",
            num_inference_steps: 40,
            guidance_scale: 10,
            image_guidance_scale: 1.2,
          },
        });
      } else {
        throw new Error("Either maskUrl or objectDescription is required");
      }

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
            description: 'Refund for failed object removal',
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
    console.error("Remove object API error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Object removal failed", message: error.message },
      { status: 500 }
    );
  }
}