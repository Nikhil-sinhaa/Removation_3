// lib/ai/fal-adapter.ts
// Uses Pollinations.ai (free, no API key) with Unsplash fallback
// Drop-in replacement for the Replicate interface used by app/api/generate/route.ts

const FALLBACK_IMAGES: Record<string, string> = {
    redesign:  "https://images.unsplash.com/photo-1600210492486-724fe5c67eb0?auto=format&fit=crop&w=1024&q=80",
    beautify:  "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1024&q=80",
    creative:  "https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1024&q=80",
    furnish:   "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1024&q=80",
    empty:     "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1024&q=80",
    outdoor:   "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1024&q=80",
    sketch:    "https://images.unsplash.com/photo-1631048035498-9d04a28b59a3?auto=format&fit=crop&w=1024&q=80",
    enhance:   "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1024&q=80",
    default:   "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1024&q=80",
};

export function isFalConfigured(): boolean {
    return true; // Pollinations needs no API key
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

    let generatedUrl: string | null = null;

    try {
        const seed = Math.floor(Math.random() * 9999999);
        const encodedPrompt = encodeURIComponent(prompt);
        const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=768&nologo=true&model=flux&seed=${seed}`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (response.ok) generatedUrl = url;
    } catch {
        // Fall through to fallback
    }

    const outputUrl = generatedUrl ?? FALLBACK_IMAGES[mode] ?? FALLBACK_IMAGES.default;
    const predictionId = `gen-${Date.now()}`;

    return { outputUrl, predictionId };
}
