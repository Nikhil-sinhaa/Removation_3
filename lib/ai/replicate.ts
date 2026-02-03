// lib/ai/replicate.ts
import Replicate from 'replicate';

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN || '',
});

interface ReplicateInput {
    model: string;
    input: Record<string, any>;
    renderId?: string;
}

interface ReplicateOutput {
    output: string | string[];
    id?: string;
    status?: string;
}

export async function runReplicateModel({ model, input }: ReplicateInput): Promise<ReplicateOutput> {
    try {
        const output = await replicate.run(model as any, { input });

        // Handle different output formats
        let finalOutput: string;
        if (Array.isArray(output)) {
            finalOutput = output[0];
        } else if (typeof output === 'string') {
            finalOutput = output;
        } else {
            finalOutput = String(output);
        }

        return {
            output: finalOutput,
        };
    } catch (error: any) {
        console.error('Replicate API error:', error);
        throw new Error(`Replicate generation failed: ${error.message}`);
    }
}

export async function generateWithReplicate({ model, input, renderId }: ReplicateInput): Promise<ReplicateOutput> {
    return runReplicateModel({ model, input, renderId });
}

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

export default runReplicateModel;
