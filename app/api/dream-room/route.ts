import { NextResponse } from "next/server";

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
            ? `An epic gaming room with RGB lighting, multiple gaming monitors, ergonomic gaming chair, gaming PC setup, neon lights, ultra-realistic interior photography, 4K`
            : `A stunning ${theme} style ${room}, professional interior design, beautiful furniture, perfect lighting, photorealistic, award-winning interior photography, 4K`;

        const seed = Math.floor(Math.random() * 9999999);
        const encodedPrompt = encodeURIComponent(prompt);
        const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=768&nologo=true&model=flux&seed=${seed}`;

        // Fetch server-side to wait for generation to complete
        const imageResponse = await fetch(pollinationsUrl);
        if (!imageResponse.ok) {
            throw new Error("Pollinations.ai failed to generate image");
        }

        // Return the stable URL (pollinations caches with seed)
        return NextResponse.json({ imageUrl: pollinationsUrl });

    } catch (error: any) {
        console.error("Dream Room Error:", error?.message || error);
        return NextResponse.json(
            { imageUrl: "", error: error?.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
