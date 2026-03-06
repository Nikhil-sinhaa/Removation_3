// lib/ai/fal-adapter.ts — fal.ai branch
import { fal } from "@fal-ai/client";

if (process.env.FAL_KEY) {
    fal.config({ credentials: process.env.FAL_KEY });
}

export function isFalConfigured(): boolean {
    return !!process.env.FAL_KEY;
}

export async function runFalPredictionSync({
    mode,
    imageUrl,
    prompt,
}: {
    mode: string;
    imageUrl: string;
    prompt: string;
}): Promise<{ outputUrl: string; predictionId: string }> {
    if (!isFalConfigured()) throw new Error("FAL_KEY is not configured");

    let result: any;
    if (mode === "empty" || mode === "remove") {
        result = await fal.subscribe("fal-ai/object-removal", { input: { image_url: imageUrl, prompt } });
    } else {
        result = await fal.subscribe("fal-ai/flux-2-lora-gallery/apartment-staging", {
            input: { image_urls: [imageUrl], prompt: `A high-end ${prompt} with realistic lighting and professional decor.`, lora_scale: 1.2, guidance_scale: 3.5, num_inference_steps: 30, image_size: "square_hd" },
        });
    }

    const data = result.data || result;
    const outputUrl = data?.images?.[0]?.url;
    if (!outputUrl) throw new Error("fal.ai did not return an image URL");

    return { outputUrl, predictionId: `fal-${Date.now()}` };
}
