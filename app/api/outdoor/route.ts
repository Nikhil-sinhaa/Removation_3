// app/api/outdoor/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/User";
import { Render } from "@/lib/db/models/Render";
import { runReplicateModel } from "@/lib/ai/replicate";
import { generateOutdoorPrompt } from "@/lib/ai/prompts";
import { z } from "zod";

const outdoorSchema = z.object({
    imageUrl: z.string().url(),
    projectId: z.string().optional(),
    outdoorType: z.enum([
        'garden',
        'patio',
        'deck',
        'pool_area',
        'balcony',
        'terrace',
        'backyard',
        'front_yard',
        'rooftop',
        'landscape'
    ]),
    style: z.string(),
    settings: z.object({
        season: z.enum(['spring', 'summer', 'autumn', 'winter']).default('summer'),
        timeOfDay: z.enum(['morning', 'afternoon', 'golden_hour', 'evening', 'night']).default('afternoon'),
        weather: z.enum(['sunny', 'cloudy', 'overcast']).default('sunny'),
        includePool: z.boolean().default(false),
        includeGarden: z.boolean().default(true),
        includeLighting: z.boolean().default(true),
        includeFurniture: z.boolean().default(true),
        plantDensity: z.enum(['minimal', 'moderate', 'lush']).default('moderate'),
        waterFeatures: z.boolean().default(false),
        firePit: z.boolean().default(false),
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
        const validatedData = outdoorSchema.parse(body);

        await connectToDatabase();

        const user = await User.findOne({ clerkId: userId });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Outdoor rendering costs 2 credits
        if (user.credits < 2) {
            return NextResponse.json(
                {
                    error: "Insufficient credits",
                    message: "Outdoor rendering requires 2 credits",
                    creditsRequired: 2,
                    creditsAvailable: user.credits
                },
                { status: 402 }
            );
        }

        // Generate outdoor design prompt
        const prompt = generateOutdoorPrompt({
            outdoorType: validatedData.outdoorType,
            style: validatedData.style,
            settings: validatedData.settings,
        });

        // Create render record
        const render = await Render.create({
            userId: user._id,
            projectId: validatedData.projectId,
            inputImage: validatedData.imageUrl,
            mode: 'outdoor',
            style: validatedData.style,
            roomType: validatedData.outdoorType,
            prompt,
            settings: validatedData.settings,
            status: 'processing',
        });

        // Deduct credits
        await User.findByIdAndUpdate(user._id, {
            $inc: { credits: -2 },
            $push: {
                creditHistory: {
                    amount: -2,
                    type: 'outdoor',
                    description: `Outdoor design (${validatedData.outdoorType})`,
                    createdAt: new Date(),
                }
            }
        });

        try {
            // Use SDXL with ControlNet for outdoor rendering
            const result = await runReplicateModel({
                model: "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
                input: {
                    image: validatedData.imageUrl,
                    prompt,
                    negative_prompt: "indoor, ceiling, enclosed space, blurry, distorted, low quality",
                    num_inference_steps: 30,
                    guidance_scale: 7.5,
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
                outdoorDetails: {
                    type: validatedData.outdoorType,
                    style: validatedData.style,
                    season: validatedData.settings?.season || 'summer',
                },
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
                        description: 'Refund for failed outdoor rendering',
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
        console.error("Outdoor API error:", error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation error", details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: "Outdoor rendering failed", message: error.message },
            { status: 500 }
        );
    }
}