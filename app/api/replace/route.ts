// app/api/replace/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from '@/lib/auth/jwt';
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/User";
import { Render } from "@/lib/db/models/Render";
import { runReplicateModel } from "@/lib/ai/replicate";
import { z } from "zod";

const replaceSchema = z.object({
  imageUrl: z.string().url(),
  maskUrl: z.string().url().optional(),
  objectToReplace: z.string().min(1),
  replacementPrompt: z.string().min(1).max(500),
  projectId: z.string().optional(),
  settings: z.object({
    matchStyle: z.boolean().default(true),
    preserveLighting: z.boolean().default(true),
    preservePerspective: z.boolean().default(true),
    blendStrength: z.number().min(0).max(1).default(0.9),
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
    const validatedData = replaceSchema.parse(body);

    await connectToDatabase();

    const user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Object replacement costs 2 credits (more complex operation)
    if (user.credits < 2) {
      return NextResponse.json(
        { 
          error: "Insufficient credits",
          message: "Object replacement requires 2 credits",
          creditsRequired: 2,
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
      mode: 'replace',
      prompt: `Replace ${validatedData.objectToReplace} with ${validatedData.replacementPrompt}`,
      settings: validatedData.settings,
      status: 'processing',
    });

    // Deduct credits
    await User.findByIdAndUpdate(user._id, {
      $inc: { credits: -2 },
      $push: { 
        creditHistory: {
          amount: -2,
          type: 'replace',
          description: 'Object replacement operation',
          createdAt: new Date(),
        }
      }
    });

    try {
      // Use instruct-pix2pix for object replacement
      const prompt = buildReplacementPrompt(
        validatedData.objectToReplace,
        validatedData.replacementPrompt,
        validatedData.settings
      );

      const result = await runReplicateModel({
        model: "timothybrooks/instruct-pix2pix:30c1d0b916a6f8efce20493f5d61ee27491ab2a60437c13c588468b9810ec23f",
        input: {
          image: validatedData.imageUrl,
          prompt,
          negative_prompt: "blurry, distorted, low quality, mismatched perspective, wrong scale",
          num_inference_steps: 40,
          guidance_scale: 7.5,
          image_guidance_scale: 1.5,
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
        creditsUsed: 2,
        creditsRemaining: user.credits - 2,
      });

    } catch (error: any) {
      // Refund credits on failure
      await User.findByIdAndUpdate(user._id, {
        $inc: { credits: 2 },
        $push: { 
          creditHistory: {
            amount: 2,
            type: 'refund',
            description: 'Refund for failed object replacement',
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
    console.error("Replace API error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Object replacement failed", message: error.message },
      { status: 500 }
    );
  }
}

function buildReplacementPrompt(
  objectToReplace: string,
  replacement: string,
  settings?: {
    matchStyle?: boolean;
    preserveLighting?: boolean;
    preservePerspective?: boolean;
  }
): string {
  let prompt = `Replace the ${objectToReplace} with ${replacement}`;
  
  if (settings?.matchStyle) {
    prompt += ", maintaining the same interior design style";
  }
  
  if (settings?.preserveLighting) {
    prompt += ", preserving the original lighting and shadows";
  }
  
  if (settings?.preservePerspective) {
    prompt += ", keeping the same perspective and scale";
  }
  
  prompt += ", photorealistic, high quality, seamless integration";
  
  return prompt;
}