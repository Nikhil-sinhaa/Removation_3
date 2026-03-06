// lib/ai/fal-adapter.ts
// Uses Pollinations.ai (free, no API key) for all image generation
// Drop-in replacement for the Replicate interface used by app/api/generate/route.ts

export function isFalConfigured(): boolean {
    // Pollinations.ai requires no API key — always available
    return true;
}

/**
 * Generate an image using Pollinations.ai (FLUX model, free, no API key).
 * Returns { outputUrl, predictionId } to match the Replicate interface.
 */
export async function runFalPredictionSync({
    mode,
    imageUrl,
    prompt,
}: {
    mode: string;
    imageUrl: string;
    prompt: string;
}): Promise<{ outputUrl: string; predictionId: string }> {

    const seed = Math.floor(Math.random() * 9999999);
    const encodedPrompt = encodeURIComponent(prompt);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=768&nologo=true&model=flux&seed=${seed}`;

    // Wait server-side for Pollinations to finish generating
    const response = await fetch(pollinationsUrl);
    if (!response.ok) {
        throw new Error(`Pollinations.ai failed: HTTP ${response.status}`);
    }

    const predictionId = `pollinations-${Date.now()}-${seed}`;
    return { outputUrl: pollinationsUrl, predictionId };
}
