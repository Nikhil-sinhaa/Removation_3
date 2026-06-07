// lib/ai/comfyui.ts
import axios from 'axios';
import { createInteriorDesignWorkflow, createInpaintingWorkflow, getRoomTypePrompt, getModePrompt, STYLE_CONFIGS } from './comfyui-workflows';
import { getActiveComfyBaseUrl } from '@/lib/ai/gpu-mode-router';

export interface ComfyUIInput {
  image: string; // URL or base64
  prompt: string;
  negative_prompt?: string;
  mode: 'redesign' | 'beautify' | 'creative' | 'furnish' | 'empty' | 'outdoor' | 'sketch' | 'enhance';
  style: string;
  roomType: string;
  settings?: {
    creativity?: number;
    preserveLayout?: boolean;
    enhanceQuality?: boolean;
    colorScheme?: string;
    materials?: string[];
    lighting?: 'natural' | 'warm' | 'cool' | 'dramatic';
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
    num_inference_steps?: number;
    guidance_scale?: number;
    strength?: number;
  };
  seed?: number;
}

export interface ComfyUIOutput {
  output: string; // URL of generated image
  processingTime?: number;
  workflow?: any;
}

class ComfyUIClient {
  private clientId: string;

  constructor() {
    this.clientId = `removation-${Date.now()}`;
  }

  private async uploadImage(imageUrl: string): Promise<string> {
    try {
      // If it's already a data URL, return as-is
      if (imageUrl.startsWith('data:')) {
        const response = await axios.post(`${getActiveComfyBaseUrl()}/view/upload`, {
          image: imageUrl,
          overwrite: true
        }, {
          headers: {
            'Content-Type': 'application/json',
          }
        });
        return response.data.name;
      }

      // Download image from URL and upload to ComfyUI
      const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(imageResponse.data);
      const base64 = buffer.toString('base64');
      const mimeType = imageResponse.headers['content-type'] || 'image/jpeg';
      const dataUrl = `data:${mimeType};base64,${base64}`;

      const uploadResponse = await axios.post(`${getActiveComfyBaseUrl()}/view/upload`, {
        image: dataUrl,
        overwrite: true
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      return uploadResponse.data.name;
    } catch (error) {
      console.error('Failed to upload image to ComfyUI:', error);
      throw new Error('Image upload failed');
    }
  }

  private createWorkflow(input: ComfyUIInput): any {
    const roomTypePrompt = getRoomTypePrompt(input.roomType);
    const modePrompt = getModePrompt(input.mode);
    const fullPrompt = `${roomTypePrompt}, ${modePrompt}, ${input.prompt}`;

    return createInteriorDesignWorkflow({
      mode: input.mode,
      style: input.style,
      roomType: input.roomType,
      prompt: fullPrompt,
      negativePrompt: input.negative_prompt || "blurry, distorted, low quality, watermark, text, unrealistic, cartoon, anime, illustration, oversaturated",
      imageName: input.image,
      settings: {
        ...input.settings,
        num_inference_steps: input.settings?.num_inference_steps || 30,
        guidance_scale: input.settings?.guidance_scale || 7,
        strength: input.settings?.strength || 0.6,
      },
      seed: input.seed || Math.floor(Math.random() * 2147483647)
    });
  }

  private async getWorkflowImage(workflowId: string): Promise<string> {
    try {
      const response = await axios.get(`${getActiveComfyBaseUrl()}/view?filename=${workflowId}.png`);
      return `${getActiveComfyBaseUrl()}/view?filename=${workflowId}.png`;
    } catch (error) {
      console.error('Failed to get workflow image:', error);
      throw new Error('Failed to retrieve generated image');
    }
  }

  async generate(input: ComfyUIInput): Promise<ComfyUIOutput> {
    const startTime = Date.now();

    try {
      // Upload input image
      const imageName = await this.uploadImage(input.image);

      // Create workflow
      const workflow = this.createWorkflow({ ...input, image: imageName });

      // Submit workflow to ComfyUI
      const promptResponse = await axios.post(`${getActiveComfyBaseUrl()}/prompt`, {
        prompt: workflow,
        client_id: this.clientId
      });

      const promptId = promptResponse.data.prompt_id;

      // Poll for completion
      let completed = false;
      let attempts = 0;
      const maxAttempts = 120; // 2 minutes timeout

      while (!completed && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
          const historyResponse = await axios.get(`${getActiveComfyBaseUrl()}/history/${promptId}`);
          const history = historyResponse.data[promptId];

          if (history) {
            completed = history.outputs !== undefined;

            if (completed && history.outputs) {
              const outputImages = history.outputs['7']?.images || [];
              if (outputImages.length > 0) {
                const filename = outputImages[0].filename;
                const imageUrl = `${getActiveComfyBaseUrl()}/view?filename=${filename}`;

                return {
                  output: imageUrl,
                  processingTime: Date.now() - startTime,
                  workflow: history
                };
              }
            }
          }
        } catch (error) {
          console.log(`Attempt ${attempts + 1}: Checking workflow status...`);
        }

        attempts++;
      }

      throw new Error('Generation timed out after 2 minutes');

    } catch (error: any) {
      console.error('ComfyUI generation failed:', error);
      throw new Error(`AI generation failed: ${error?.message || 'Unknown error'}`);
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${getActiveComfyBaseUrl()}/system_stats`, { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async getQueueStatus(): Promise<any> {
    try {
      const response = await axios.get(`${getActiveComfyBaseUrl()}/queue`);
      return response.data;
    } catch (error) {
      console.error('Failed to get queue status:', error);
      return null;
    }
  }
}

// Singleton instance
let comfyUIClient: ComfyUIClient | null = null;

export function getComfyUIClient(): ComfyUIClient {
  if (!comfyUIClient) {
    comfyUIClient = new ComfyUIClient();
  }
  return comfyUIClient;
}

export async function generateWithComfyUI(input: ComfyUIInput): Promise<ComfyUIOutput> {
  const client = getComfyUIClient();

  // Check if ComfyUI is running
  const isHealthy = await client.checkHealth();
  if (!isHealthy) {
    throw new Error(
      'ComfyUI server is not running. Please start ComfyUI with:\n' +
      'cd /home/nikhil/Documents/Remo2/ComfyUI\n' +
      'source venv/bin/activate\n' +
      'python main.py'
    );
  }

  return client.generate(input);
}

export function getModelForMode(mode: string): string {
  // ComfyUI uses workflows instead of model IDs
  // This function is kept for compatibility with existing code
  return `comfyui-${mode}`;
}

export default generateWithComfyUI;
