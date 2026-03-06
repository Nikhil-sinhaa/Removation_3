import { fal } from "@fal-ai/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/User";
import { Render } from "@/lib/db/models/Render";

// Initialize fal.ai client with API key
if (process.env.FAL_KEY) {
    fal.config({
        credentials: process.env.FAL_KEY,
    });
}

export async function POST(req: NextRequest) {
    try {
        if (!process.env.FAL_KEY) {
            return NextResponse.json(
                { error: "Staging service not configured", message: "FAL_KEY is missing." },
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
        const { imageUrl, prompt, projectId, roomType, style } = body;

        if (!imageUrl) {
            return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
        }

        if (!prompt && !style) {
            return NextResponse.json({ error: "Prompt or style is required for staging" }, { status: 400 });
        }

        await connectToDatabase();

        const user = await User.findOne({ clerkId: userId });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Staging costs 2 credits
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

        const stagingPrompt = prompt || style || 'modern';

        // Create render record
        const render = await Render.create({
            userId: user._id,
            clerkId: userId,
            projectId: projectId,
            inputImage: imageUrl,
            mode: 'staging',
            style: style || 'modern',
            roomType: roomType || 'room',
            prompt: stagingPrompt,
            status: 'processing',
        });

        // Deduct credits
        await User.findByIdAndUpdate(user._id, {
            $inc: { credits: -2 },
            $push: {
                creditHistory: {
                    amount: -2,
                    type: 'staging',
                    description: 'Virtual staging',
                    createdAt: new Date(),
                }
            }
        });

        try {
            // ------------------------------------------------------------------
            // VASTU SHASTRA INTEGRATION POINT
            // ------------------------------------------------------------------
            // Here is where you can dynamically inject Vastu Shastra rules into the fal.ai prompt.
            // Ensure the `vastuRules` string contains descriptive details (e.g., "Use light green colors for the North direction to promote growth.").
            const vastuRules = "";

            let finalPrompt = `A high-end ${stagingPrompt} style room with modern furniture, realistic lighting, and professional decor.`;

            // Append Vastu rules if provided
            if (vastuRules) {
                finalPrompt += ` Integrate these Vastu principles: ${vastuRules}`;
            }

            // Call fal.ai apartment staging model
            const result: any = await fal.subscribe("fal-ai/flux-2-lora-gallery/apartment-staging", {
                input: {
                    image_urls: [imageUrl],
                    prompt: finalPrompt,
                    lora_scale: 1.2, // LoRA scale: 1.0 is standard; higher (up to 2.0) adds more furniture
                    guidance_scale: 3.5,
                    num_inference_steps: 30,
                    image_size: "square_hd"
                }
            });

            const stageData = result.data || result;

            if (!stageData || !stageData.images || stageData.images.length === 0) {
                throw new Error("No image returned from fal.ai");
            }

            const outputImageUrl = stageData.images[0].url;

            // Update render with result
            await Render.findByIdAndUpdate(render._id, {
                outputImage: outputImageUrl,
                status: 'completed',
                completedAt: new Date(),
                processingTime: Date.now() - render.createdAt.getTime(),
            });

            return NextResponse.json({
                success: true,
                renderId: render._id.toString(),
                outputImage: outputImageUrl,
                imageUrl: outputImageUrl, // Keeping this for backward compatibility with frontend
                creditsUsed: 2,
                creditsRemaining: user.credits - 2,
            }, { status: 200 });

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
        console.error("Staging API Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to process staging request" },
            { status: 500 }
        );
    }
}
