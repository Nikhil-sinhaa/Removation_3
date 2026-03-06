import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { imageUrl, area, color } = await request.json();

        if (!imageUrl || !area || !color) {
            return NextResponse.json(
                { imageUrl: "", error: "imageUrl, area, and color are required" },
                { status: 400 }
            );
        }

        const prompt = `A photorealistic interior room with the ${area} painted in ${color} color. Beautiful lighting, professional interior photography, high quality, ultra-realistic, showing clear ${area} surface in ${color}`;

        const seed = Math.floor(Math.random() * 9999999);
        const encodedPrompt = encodeURIComponent(prompt);
        const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=768&nologo=true&model=flux&seed=${seed}`;

        // Wait for generation server-side
        const imageResponse = await fetch(pollinationsUrl);
        if (!imageResponse.ok) {
            throw new Error("Pollinations.ai failed to generate image");
        }

        return NextResponse.json({ imageUrl: pollinationsUrl });

    } catch (error: any) {
        console.error("Color Visualizer Error:", error?.message || error);
        return NextResponse.json(
            { imageUrl: "", error: error?.message || "Failed to generate" },
            { status: 500 }
        );
    }
}
