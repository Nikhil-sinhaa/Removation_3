// lib/ai/fal-adapter.ts — fal.ai branch
import { fal } from "@fal-ai/client";

if (process.env.FAL_KEY) {
    fal.config({ credentials: process.env.FAL_KEY });
}

export function isFalConfigured(): boolean {
    return !!process.env.FAL_KEY;
}

/**
 * Upload a remote image to fal.storage so fal.ai can access it.
 * This bypasses hotlink protection on UploadThing URLs.
 */
async function uploadToFalStorage(imageUrl: string): Promise<string> {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Failed to fetch source image: ${response.status}`);
    const buffer = await response.arrayBuffer();
    const mimeType = response.headers.get("content-type") || "image/jpeg";
    const file = new File([buffer], "room.jpg", { type: mimeType });
    return await fal.storage.upload(file);
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

    // Upload to fal.storage first to avoid 403 Forbidden reading directly from UploadThing
    const falStorageUrl = await uploadToFalStorage(imageUrl);

    let result: any;
    if (mode === "empty" || mode === "remove") {
        result = await fal.subscribe("fal-ai/object-removal", { input: { image_url: falStorageUrl, prompt } });
    } else {
        result = await fal.subscribe("fal-ai/flux-2-lora-gallery/apartment-staging", {
            input: { image_urls: [falStorageUrl], prompt: `A high-end ${prompt} with realistic lighting and professional decor.`, lora_scale: 1.2, guidance_scale: 3.5, num_inference_steps: 30, image_size: "square_hd" },
        });
    }

    const data = result.data || result;
    const outputUrl = data?.images?.[0]?.url;
    if (!outputUrl) throw new Error("fal.ai did not return an image URL");

    return { outputUrl, predictionId: `fal-${Date.now()}` };
}
