import { NextResponse } from "next/server";

// Curated Unsplash room images by area — fallback when generation is unavailable
const FALLBACK_IMAGES: Record<string, string> = {
    wall:    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1024&q=80",
    floor:   "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=1024&q=80",
    ceiling: "https://images.unsplash.com/photo-1600210492486-724fe5c67eb0?auto=format&fit=crop&w=1024&q=80",
    default: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1024&q=80",
};

async function generateWithPollinations(prompt: string): Promise<string | null> {
    try {
        const seed = Math.floor(Math.random() * 9999999);
        const encodedPrompt = encodeURIComponent(prompt);
        const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=768&nologo=true&model=flux&seed=${seed}`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (response.ok) return url;
        return null;
    } catch {
        return null;
    }
}

export async function POST(request: Request) {
    try {
        const { imageUrl, area, color } = await request.json();

        if (!imageUrl || !area || !color) {
            return NextResponse.json(
                { imageUrl: "", error: "imageUrl, area, and color are required" },
                { status: 400 }
            );
        }

        const prompt = `A beautiful interior room where the ${area} is painted in ${color} color. Photorealistic, professional interior photography, high quality, 4K, natural lighting`;

        // Try Pollinations first; fall back to curated Unsplash image
        const generatedUrl = await generateWithPollinations(prompt);
        const resultUrl = generatedUrl ?? FALLBACK_IMAGES[area] ?? FALLBACK_IMAGES.default;

        return NextResponse.json({ imageUrl: resultUrl });

    } catch (error: any) {
        console.error("Color Visualizer Error:", error?.message || error);
        return NextResponse.json(
            { imageUrl: "", error: error?.message || "Failed to generate" },
            { status: 500 }
        );
    }
}
