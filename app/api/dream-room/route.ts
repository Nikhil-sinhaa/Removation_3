import { NextResponse } from "next/server";

// Curated Unsplash room images by theme — used as fallback when generation is unavailable
const FALLBACK_ROOMS: Record<string, string> = {
    "Modern":      "https://images.unsplash.com/photo-1600210492486-724fe5c67eb0?auto=format&fit=crop&w=1024&q=80",
    "Minimalist":  "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1024&q=80",
    "Traditional": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1024&q=80",
    "Industrial":  "https://images.unsplash.com/photo-1631048035498-9d04a28b59a3?auto=format&fit=crop&w=1024&q=80",
    "Bohemian":    "https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1024&q=80",
    "Scandinavian":"https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1024&q=80",
    "Gaming Room": "https://images.unsplash.com/photo-1593640408182-31c228b87c24?auto=format&fit=crop&w=1024&q=80",
    "default":     "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1024&q=80",
};

async function generateWithPollinations(prompt: string): Promise<string | null> {
    try {
        const seed = Math.floor(Math.random() * 9999999);
        const encodedPrompt = encodeURIComponent(prompt);
        const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=768&nologo=true&model=flux&seed=${seed}`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000); // 20s timeout

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
        const { imageUrl, theme, room } = await request.json();

        if (!imageUrl || !theme || !room) {
            return NextResponse.json(
                { imageUrl: "", error: "imageUrl, theme, and room are required" },
                { status: 400 }
            );
        }

        const prompt = room === "Gaming Room"
            ? `An epic gaming room with RGB lighting, gaming monitors, ergonomic chair, high-end PC setup, professional interior photography, 4K`
            : `A stunning ${theme} style ${room}, professional interior design, beautiful furniture, perfect lighting, 4K photorealistic`;

        // Try Pollinations first; fall back to curated Unsplash image
        const generatedUrl = await generateWithPollinations(prompt);
        const resultUrl = generatedUrl
            ?? FALLBACK_ROOMS[theme]
            ?? FALLBACK_ROOMS[room]
            ?? FALLBACK_ROOMS.default;

        return NextResponse.json({ imageUrl: resultUrl });

    } catch (error: any) {
        console.error("Dream Room Error:", error?.message || error);
        return NextResponse.json(
            { imageUrl: "", error: error?.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
