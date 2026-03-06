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

        const { imageUrl, theme, room } = await request.json();

        if (!imageUrl || !theme || !room) {
            return NextResponse.json({ imageUrl: "", error: "imageUrl, theme, and room are required" }, { status: 400 });
        }

        const prompt = room === "Gaming Room"
            ? `A high-end gaming room setup with RGB lighting, gaming monitors, gaming chairs, and high-end gaming equipment. Maintain the same room layout and perspective.`
            : `A high-end ${theme.toLowerCase()} style ${room.toLowerCase()} with appropriate furniture, realistic lighting, and professional decor. Ultra-realistic, award-winning interior photo.`;

        const result: any = await fal.subscribe("fal-ai/flux-2-lora-gallery/apartment-staging", {
            input: {
                image_urls: [imageUrl],
                prompt,
                lora_scale: 1.2,
                guidance_scale: 3.5,
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
        console.error("Dream Room (fal.ai) Error:", error?.message || error);
        return NextResponse.json({ imageUrl: "", error: error?.message || "Internal Server Error" }, { status: 500 });
    }
}
