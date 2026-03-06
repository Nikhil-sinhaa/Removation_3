import { NextResponse } from "next/server";

// ── REPLICATE BRANCH ─────────────────────────────────────────────────────────
// Requires: REPLICATE_API_TOKEN in .env.local
// Sign up & add credits at: https://replicate.com/account/billing

export async function POST(request: Request) {
    try {
        if (!process.env.REPLICATE_API_TOKEN) {
            return NextResponse.json({ imageUrl: "", error: "REPLICATE_API_TOKEN is not set" }, { status: 500 });
        }

        const { imageUrl, theme, room } = await request.json();
        if (!imageUrl || !theme || !room) {
            return NextResponse.json({ imageUrl: "", error: "imageUrl, theme, and room are required" }, { status: 400 });
        }

        const prompt = room === "Gaming Room"
            ? "a room for gaming with gaming computers, gaming consoles, and gaming chairs"
            : `a ${theme.toLowerCase()} ${room.toLowerCase()}`;

        const startResponse = await fetch("https://api.replicate.com/v1/predictions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Token " + process.env.REPLICATE_API_TOKEN,
            },
            body: JSON.stringify({
                version: "854e8727697a057c525cdb45ab037f64ecca770a1769cc52287c2e56472a247b",
                input: {
                    image: imageUrl,
                    prompt,
                    a_prompt: "best quality, extremely detailed, photo from Pinterest, interior, cinematic photo, ultra-detailed, ultra-realistic, award-winning",
                    n_prompt: "longbody, lowres, bad anatomy, bad hands, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality",
                },
            }),
        });

        if (!startResponse.ok) {
            const err = await startResponse.text();
            console.error("Replicate start error:", err);
            return NextResponse.json({ imageUrl: "", error: "Failed to start Replicate generation" }, { status: 500 });
        }

        const { urls } = await startResponse.json();

        let restoredImage: string | null = null;
        for (let i = 0; i < 60; i++) {
            const poll = await fetch(urls.get, {
                headers: { Authorization: "Token " + process.env.REPLICATE_API_TOKEN },
            });
            const json = await poll.json();
            if (json.status === "succeeded") { restoredImage = json.output; break; }
            if (json.status === "failed") break;
            await new Promise(r => setTimeout(r, 1000));
        }

        return NextResponse.json({ imageUrl: restoredImage ?? "" });

    } catch (error: any) {
        console.error("Dream Room (Replicate) Error:", error?.message);
        return NextResponse.json({ imageUrl: "", error: error?.message }, { status: 500 });
    }
}
