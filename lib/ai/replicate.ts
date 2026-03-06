// lib/ai/replicate.ts
import Replicate from 'replicate';
import { isReplicateConfigured, getWebhookUrl } from '@/lib/env';

// Lazy initialization — only create client when first used
let _replicate: Replicate | null = null;

function getReplicateClient(): Replicate {
    if (!isReplicateConfigured()) {
        throw new Error(
            'REPLICATE_API_TOKEN is not configured. ' +
            'Set it in your .env.local file to enable AI image generation.'
        );
    }

    if (!_replicate) {
        _replicate = new Replicate({
            auth: process.env.REPLICATE_API_TOKEN!,
        });
    }

    return _replicate;
}

interface ReplicateInput {
    model: string;
    input: Record<string, any>;
    renderId?: string;
}

interface ReplicateOutput {
    output: string | string[];
    predictionId?: string;
    status?: string;
}

/**
 * Run a Replicate model synchronously (waits for result).
 * Used by: enhance, inpaint, remove-object, replace, fill-room, outdoor, sketch-to-render
 */
export async function runReplicateModel({ model, input }: ReplicateInput): Promise<ReplicateOutput> {
    const replicate = getReplicateClient();

    try {
        console.log(`[Replicate] Running model: ${model.split(':')[0]}`);
        const startTime = Date.now();

        const output = await replicate.run(model as `${string}/${string}:${string}`, { input });

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`[Replicate] Model completed in ${elapsed}s`);

        // Normalize output to string
        const finalOutput = normalizeOutput(output);

        return {
            output: finalOutput,
        };
    } catch (error: any) {
        console.error('[Replicate] API error:', {
            model: model.split(':')[0],
            message: error.message,
            status: error.response?.status,
        });

        // Provide user-friendly error messages
        if (error.response?.status === 401) {
            throw new Error('Invalid Replicate API token. Check your REPLICATE_API_TOKEN.');
        }
        if (error.response?.status === 422) {
            throw new Error(`Invalid model input parameters: ${error.message}`);
        }
        if (error.response?.status === 429) {
            throw new Error('Replicate rate limit reached. Please try again in a moment.');
        }

        throw new Error(`AI generation failed: ${error.message}`);
    }
}

/**
 * Create an async Replicate prediction with webhook callback.
 * Used by: generate/route.ts (multiple variations, fire-and-forget with webhook)
 */
export async function createReplicatePrediction({
    model,
    input,
}: ReplicateInput): Promise<{ predictionId: string }> {
    const replicate = getReplicateClient();

    try {
        const [owner, rest] = model.split('/');
        const [modelName, version] = (rest || '').split(':');

        if (!version) {
            throw new Error(`Model string must include version hash: ${model}`);
        }

        const webhookUrl = getWebhookUrl('replicate');
        console.log(`[Replicate] Creating async prediction: ${owner}/${modelName}, webhook: ${webhookUrl}`);

        const prediction = await replicate.predictions.create({
            version,
            input,
            webhook: webhookUrl,
            webhook_events_filter: ['start', 'completed'],
        });

        console.log(`[Replicate] Prediction created: ${prediction.id}`);

        return {
            predictionId: prediction.id,
        };
    } catch (error: any) {
        console.error('[Replicate] Prediction creation error:', error.message);
        throw new Error(`Failed to start AI generation: ${error.message}`);
    }
}

/**
 * Create a Replicate prediction WITHOUT a webhook and wait for it to finish.
 * Used by: generate/route.ts in REPLICATE_USE_SYNC=true mode (local dev).
 * 
 * Polls status every 3 seconds. Timeout after 5 minutes.
 * Returns the output URL so the render can be saved as 'completed' immediately.
 */
export async function runReplicatePredictionSync({
    model,
    input,
}: ReplicateInput): Promise<{ outputUrl: string; predictionId: string }> {
    const replicate = getReplicateClient();

    const [, rest] = model.split('/');
    const [, version] = (rest || '').split(':');

    if (!version) {
        throw new Error(`Model string must include version hash: ${model}`);
    }

    console.log(`[Replicate Sync] Creating prediction (no webhook)...`);

    // Create prediction without webhook
    const prediction = await replicate.predictions.create({
        version,
        input,
    });

    console.log(`[Replicate Sync] Prediction ${prediction.id} created, polling...`);

    // Poll until done
    const maxAttempts = 100; // 5 minutes (100 * 3s)
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 3000));

        const current = await replicate.predictions.get(prediction.id);
        console.log(`[Replicate Sync] Attempt ${attempt + 1}: status=${current.status}`);

        if (current.status === 'succeeded') {
            const outputUrl = normalizeOutput(current.output);
            if (!outputUrl) {
                throw new Error('Replicate returned no output URL');
            }
            console.log(`[Replicate Sync] Done! Output: ${outputUrl}`);
            return { outputUrl, predictionId: prediction.id };
        }

        if (current.status === 'failed' || current.status === 'canceled') {
            throw new Error(`Replicate prediction ${current.status}: ${current.error || 'unknown error'}`);
        }
    }

    throw new Error('Replicate prediction timed out after 5 minutes');
}

/**
 * Alias for backward compatibility — delegates to runReplicateModel
 */
export async function generateWithReplicate(params: ReplicateInput): Promise<ReplicateOutput> {
    return runReplicateModel(params);
}

/**
 * Get the correct Replicate model ID for a given generation mode.
 */
export function getModelForMode(mode: string): string {
    const models: Record<string, string> = {
        redesign: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
        beautify: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
        creative: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
        furnish: 'jagilley/controlnet-hough:854e8727697a057c525cdb45ab037f64ecca770a1769cc52287c2e56e49c0d9d',
        empty: 'stability-ai/sdxl-inpainting:95b7223104132402a9ae91cc677285bc5eb997834bd2349fa486f53910fd68b3',
        outdoor: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
        sketch: 'jagilley/controlnet-scribble:435061a1b5a4c1e26740464bf786efdfa9cb3a3ac488595a2de23e143fdb0117',
        enhance: 'nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa',
    };

    return models[mode] || models.redesign;
}

/**
 * Normalize Replicate output to a single URL string.
 */
function normalizeOutput(output: unknown): string {
    if (Array.isArray(output)) {
        // Most models return an array of URLs
        return output[0] as string;
    }
    if (typeof output === 'string') {
        return output;
    }
    if (output && typeof output === 'object' && 'url' in output) {
        return (output as any).url;
    }
    console.warn('[Replicate] Unexpected output format:', typeof output);
    return String(output);
}

export default runReplicateModel;
