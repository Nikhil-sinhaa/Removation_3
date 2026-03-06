// lib/ai/fal-adapter.ts — Replicate branch
// On this branch, we revert the fal adapter back to calling Replicate
// so the generate route still works with Replicate

import { runReplicatePredictionSync, isReplicateConfigured } from "@/lib/ai/replicate";

export function isFalConfigured(): boolean {
    // On the replicate branch, we check Replicate instead
    return isReplicateConfigured();
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
    
    // Map mode back to replicate input
    const replicateInput = {
        image: imageUrl,
        prompt,
        negative_prompt: "blurry, distorted, low quality, watermark, text, unrealistic, cartoon, anime, illustration, oversaturated",
        num_inference_steps: mode === 'enhance' ? 50 : 30,
        guidance_scale: 7.5,
        seed: Math.floor(Math.random() * 2147483647),
        strength: 0.85,
    };

    // Use the existing Replicate models map
    const models: Record<string, string> = {
        redesign: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
        furnish: 'jagilley/controlnet-hough:854e8727697a057c525cdb45ab037f64ecca770a1769cc52287c2e56e49c0d9d',
        empty: 'stability-ai/sdxl-inpainting:95b7223104132402a9ae91cc677285bc5eb997834bd2349fa486f53910fd68b3',
        sketch: 'jagilley/controlnet-scribble:435061a1b5a4c1e26740464bf786efdfa9cb3a3ac488595a2de23e143fdb0117',
        enhance: 'nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa',
    };
    const model = models[mode] || models.redesign;

    return runReplicatePredictionSync({ model, input: replicateInput });
}
