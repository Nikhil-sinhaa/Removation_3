// app/api/fill-room/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import User from "@/lib/db/models/User";
import Render from "@/lib/db/models/Render";
import runReplicateModel from "@/lib/ai/replicate";
import { generateFurnishingPrompt } from "@/lib/ai/prompts";
import { z } from "zod";

const fillRoomSchema = z.object({
    imageUrl: z.string().url(),
    roomType: z.string(),
    style: z.string(),
    projectId: z.string().optional(),
    furniture: z.array(z.string()).optional(),
    settings: z.object({
        density: z.enum(['minimal', 'moderate', 'full']).default('moderate'),
        budget: z.enum(['budget', 'mid-range', 'luxury']).default('mid-range'),
        colorScheme: z.string().optional(),
        preserveLayout: z.boolean().default(true),
        includeDecor: z.boolean().default(true),
        includePlants: z.boolean().default(true),
        includeLighting: z.boolean().default(true),
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
        const validatedData = fillRoomSchema.parse(body);

        await connectToDatabase();

        const user = await User.findOne({ clerkId: userId });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Fill room/virtual staging costs 2 credits
        if (user.credits < 2) {
            return NextResponse.json(
                {
                    error: "Insufficient credits",
                    message: "Virtual staging requires 2 credits",
                    creditsRequired: 2,
                    creditsAvailable: user.credits
                },
                { status: 402 }
            );
        }

        // Generate furnishing prompt
        const prompt = generateFurnishingPrompt({
            roomType: validatedData.roomType,
            style: validatedData.style,
            furniture: validatedData.furniture,
            settings: validatedData.settings,
        });

        // Create render record
        const render = await Render.create({
            userId: user._id,
            projectId: validatedData.projectId,
            inputImage: validatedData.imageUrl,
            mode: 'fill_room',
            style: validatedData.style,
            roomType: validatedData.roomType,
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
                    type: 'fill_room',
                    description: 'Virtual staging',
                    createdAt: new Date(),
                }
            }
        });

        try {
            // Use ControlNet + SDXL for room filling
            const result = await runReplicateModel({
                model: "jagilley/controlnet-hough:854e8727697a057c525cdb45ab037f64ecca770a1769cc52287c2e56e49c0d9d",
                input: {
                    image: validatedData.imageUrl,
                    prompt,
                    negative_prompt: "empty room, bare walls, no furniture, blurry, distorted, unrealistic, cartoon",
                    num_inference_steps: 35,
                    guidance_scale: 8,
                    controlnet_conditioning_scale: 0.7,
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
                furnishingDetails: {
                    style: validatedData.style,
                    density: validatedData.settings?.density || 'moderate',
                    furniture: validatedData.furniture || getDefaultFurniture(validatedData.roomType),
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
                        description: 'Refund for failed virtual staging',
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
        console.error("Fill room API error:", error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation error", details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: "Virtual staging failed", message: error.message },
            { status: 500 }
        );
    }
}

function getDefaultFurniture(roomType: string): string[] {
    const furniture: Record<string, string[]> = {
        living_room: ['sofa', 'coffee table', 'armchair', 'TV unit', 'rug', 'floor lamp'],
        bedroom: ['bed', 'nightstands', 'wardrobe', 'dresser', 'bedside lamps'],
        dining_room: ['dining table', 'chairs', 'sideboard', 'chandelier'],
        kitchen: ['island counter', 'bar stools', 'pendant lights'],
        office: ['desk', 'office chair', 'bookshelf', 'desk lamp'],
        bathroom: ['vanity', 'mirror', 'towel rack', 'bath accessories'],
    };

    return furniture[roomType] || furniture.living_room;
}