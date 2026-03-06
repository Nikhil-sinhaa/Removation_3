import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";

if (process.env.FAL_KEY) {
    fal.config({ credentials: process.env.FAL_KEY });
}

export async function POST(request: Request) {
    try {
        if (!process.env.FAL_KEY) {
            return NextResponse.json({ imageUrl: "", error: "FAL_KEY is not set in .env.local" }, { status: 500 });
        }

        const { imageUrl, area, color } = await request.json();

        if (!imageUrl || !area || !color) {
            return NextResponse.json({ imageUrl: "", error: "imageUrl, area, and color are required" }, { status: 400 });
        }

        const prompt = `Recolor ONLY the ${area} to ${color}. Do NOT change any furniture, decor, objects, room style, lighting, shadows, or layout. Keep everything exactly the same except the ${area} color which should be ${color}.`;

        const result: any = await fal.subscribe("fal-ai/flux-2-lora-gallery/apartment-staging", {
            input: {
                image_urls: [imageUrl],
                prompt,
                lora_scale: 0.8,
                guidance_scale: 4.5,
                num_inference_steps: 30,
                image_size: "square_hd",
            },
        });

        const data = result.data || result;
        const outputUrl = data?.images?.[0]?.url;

        if (!outputUrl) {
            return NextResponse.json({ imageUrl: "", error: "fal.ai did not return an image" }, { status: 500 });
        }

        return NextResponse.json({ imageUrl: outputUrl });

    } catch (error: any) {
        console.error("Color Visualizer (fal.ai) Error:", error?.message || error);
        return NextResponse.json({ imageUrl: "", error: error?.message || "Failed to generate" }, { status: 500 });
    }
}
