import { NextResponse } from "next/server";

// ── REPLICATE BRANCH ─────────────────────────────────────────────────────────
// Requires: REPLICATE_API_TOKEN with credits at replicate.com

export async function POST(request: Request) {
    try {
        if (!process.env.REPLICATE_API_TOKEN) {
            return NextResponse.json({ imageUrl: "", error: "REPLICATE_API_TOKEN is not set" }, { status: 500 });
        }

        const { imageUrl, area, color } = await request.json();
        if (!imageUrl || !area || !color) {
            return NextResponse.json({ imageUrl: "", error: "imageUrl, area, and color are required" }, { status: 400 });
        }

        const prompt = `A room with the ${area} painted ${color}. Photorealistic interior design.`;

        const startResponse = await fetch("https://api.replicate.com/v1/predictions", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: "Token " + process.env.REPLICATE_API_TOKEN },
            body: JSON.stringify({
                version: "854e8727697a057c525cdb45ab037f64ecca770a1769cc52287c2e56472a247b",
                input: { image: imageUrl, prompt, a_prompt: "best quality, photorealistic", n_prompt: "blurry, low quality" },
            }),
        });

        if (!startResponse.ok) {
            return NextResponse.json({ imageUrl: "", error: "Failed to start Replicate generation" }, { status: 500 });
        }

        const { urls } = await startResponse.json();
        let resultImage: string | null = null;
        for (let i = 0; i < 60; i++) {
            const poll = await fetch(urls.get, { headers: { Authorization: "Token " + process.env.REPLICATE_API_TOKEN } });
            const json = await poll.json();
            if (json.status === "succeeded") { resultImage = json.output; break; }
            if (json.status === "failed") break;
            await new Promise(r => setTimeout(r, 1000));
        }

        return NextResponse.json({ imageUrl: resultImage ?? "" });
    } catch (error: any) {
        return NextResponse.json({ imageUrl: "", error: error?.message }, { status: 500 });
    }
}
