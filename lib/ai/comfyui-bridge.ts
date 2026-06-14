// lib/ai/comfyui-bridge.ts
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { getActiveComfyBaseUrl, isCloudMode } from './gpu-mode-router';
import { uploadImageToRemoteComfy, downloadOutputFromRemoteComfy } from './cloud-comfy-adapter';
import { saveGeneratedImage } from '@/lib/storage/storageService';

export interface GenerationRequest {
  image: string; // File path or base64
  prompt: string;
  negative_prompt?: string;
  mode: string;
  style: string;
  roomType: string;
  settings?: any;
  userId: string;
}

export interface GenerationResult {
  success: boolean;
  originalImage: string;
  generatedImage?: string;
  error?: string;
  processingTime?: number;
  prompt: string;
  status: 'processing' | 'completed' | 'failed';
}

class ComfyUIBridge {
  private uploadDir: string;
  private outputDir: string;
  private publicDir: string;
  private comfyInputDir: string;

  constructor() {
    // URL is always resolved dynamically so mode-switching works without restart
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.outputDir = process.env.COMFY_OUTPUT || '/home/nikhil/Documents/Remo2/ComfyUI/output';
    this.publicDir = path.join(process.cwd(), 'public', 'renders');
    this.comfyInputDir = process.env.COMFY_INPUT || '/home/nikhil/Documents/Remo2/ComfyUI/input';

    this.ensureDirectories();
  }

  /** Active base URL — always call this rather than reading a cached field. */
  private get baseUrl(): string {
    return getActiveComfyBaseUrl();
  }

  private ensureDirectories(): void {
    [this.uploadDir, this.publicDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async uploadImage(imagePath: string): Promise<string> {
    try {
      const imageBuffer = fs.readFileSync(imagePath);
      const filename = `upload_${Date.now()}_${path.basename(imagePath)}`;

      if (isCloudMode()) {
        // Upload directly to remote ComfyUI via HTTP
        return await uploadImageToRemoteComfy(imageBuffer, filename, this.baseUrl);
      }

      // Local: write to ComfyUI input directory on disk
      const comfyUIInputDir = this.comfyInputDir;
      if (!fs.existsSync(comfyUIInputDir)) {
        fs.mkdirSync(comfyUIInputDir, { recursive: true });
      }
      const outputPath = path.join(comfyUIInputDir, filename);
      fs.writeFileSync(outputPath, imageBuffer);
      console.log(`📸 Image saved to ComfyUI input: ${filename}`);
      return filename;
    } catch (error) {
      console.error('Failed to save image to ComfyUI input:', error);
      throw new Error('Image upload failed');
    }
  }

  createWorkflow(request: GenerationRequest): any {
    const { image, prompt, negative_prompt, mode, style, roomType, settings } = request;

    // Img2Img workflow - actually transforms the uploaded image
    const workflow: any = {
      "1": {
        "inputs": {
          "ckpt_name": "sd_xl_base_1.0.safetensors"
        },
        "class_type": "CheckpointLoaderSimple"
      },
      "2": {
        "inputs": {
          "text": `${prompt}, ${style} ${roomType} interior design, professional photography, high quality`,
          "clip": ["1", 1]
        },
        "class_type": "CLIPTextEncode"
      },
      "3": {
        "inputs": {
          "text": `${negative_prompt || 'blurry, distorted, low quality, watermark, text, unrealistic, cartoon, anime, illustration, oversaturated'}`,
          "clip": ["1", 1]
        },
        "class_type": "CLIPTextEncode"
      },
      "4": {
        "inputs": {
          "image": image,
          "upload": "image"
        },
        "class_type": "LoadImage"
      },
      "5": {
        "inputs": {
          "pixels": ["4", 0],
          "vae": ["1", 2]
        },
        "class_type": "VAEEncode"
      },
      "6": {
        "inputs": {
          "seed": Math.floor(Math.random() * 2147483647),
          "steps": settings?.num_inference_steps || 20,
          "cfg": settings?.guidance_scale || 7,
          "sampler_name": "dpmpp_2m",
          "scheduler": "karras",
          "denoise": settings?.strength || 0.75,
          "model": ["1", 0],
          "positive": ["2", 0],
          "negative": ["3", 0],
          "latent_image": ["5", 0]
        },
        "class_type": "KSampler"
      },
      "7": {
        "inputs": {
          "samples": ["6", 0],
          "vae": ["1", 2]
        },
        "class_type": "VAEDecode"
      },
      "8": {
        "inputs": {
          "filename_prefix": `removation-${mode}-${style}-${Date.now()}`,
          "images": ["7", 0]
        },
        "class_type": "SaveImage"
      }
    };

    return workflow;
  }

  async generate(request: GenerationRequest): Promise<GenerationResult> {
    const startTime = Date.now();

    try {
      // Step 1: Upload image to ComfyUI
      const uploadedImageName = await this.uploadImage(request.image);

      // Step 2: Create workflow
      const workflow = this.createWorkflow({
        ...request,
        image: uploadedImageName,
      });

      // Step 3: Submit to ComfyUI
      const promptData = { prompt: workflow };
      const response = await axios.post(`${this.baseUrl}/prompt`, promptData);
      const promptId = response.data.prompt_id;
      
      console.log(`🎯 ComfyUI generation started: ${promptId}`);

      // Step 4: Wait for completion
      const result = await this.waitForCompletion(promptId);

      if (result.success && result.outputImage) {
        // Step 5: Download result to public folder
        const publicImagePath = await this.downloadImage(result.outputImage, request.userId);

        return {
          success: true,
          originalImage: request.image,
          generatedImage: publicImagePath,
          prompt: request.prompt,
          status: 'completed',
          processingTime: Date.now() - startTime,
        };
      } else {
        return {
          success: false,
          originalImage: request.image,
          error: result.error,
          prompt: request.prompt,
          status: 'failed',
          processingTime: Date.now() - startTime,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        originalImage: request.image,
        error: error.message,
        prompt: request.prompt,
        status: 'failed',
        processingTime: Date.now() - startTime,
      };
    }
  }

  private async waitForCompletion(promptId: string): Promise<{ success: boolean; outputImage?: string; error?: string }> {
    // TODO: VERCEL-TIMEOUT — This polling loop runs up to 6 minutes (180 × 2s).
    // When DEPLOYMENT_TARGET=vercel, this must be replaced with an async job pattern:
    // 1. Submit job to ComfyUI → get prompt_id → return immediately
    // 2. Frontend polls /api/ai/status/[jobId] (already exists in Redis queue)
    // 3. GPU machine POSTs result back to /api/ai/callback/[jobId] when done
    // OR: Vercel polls the GPU machine's /status endpoint on a shorter interval
    // See Phase 4 of the architecture plan.
    // Ticket: implement-vercel-async-jobs
    const maxAttempts = 180; // 6 minutes max (was 2 minutes)
    const checkInterval = 2000; // 2 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await axios.get(`${this.baseUrl}/history/${promptId}`);
        const history = response.data;
        const promptHistory = history[promptId];

        if (promptHistory) {
          // FIX: ComfyUI returns status.status_str, not status.str
          if (promptHistory.status?.status_str === 'success' || promptHistory.status?.completed) {
            // Find the output image
            const outputs = promptHistory.outputs;
            for (const nodeId in outputs) {
              const images = outputs[nodeId].images;
              if (images && images.length > 0) {
                return {
                  success: true,
                  outputImage: images[0].filename,
                };
              }
            }
          } else if (promptHistory.status?.status_str === 'error') {
            return {
              success: false,
              error: promptHistory.status?.messages?.[0]?.[1] || 'Generation failed',
            };
          }
        }

        await new Promise(resolve => setTimeout(resolve, checkInterval));
      } catch (error) {
        console.error(`Error checking generation status (attempt ${attempt + 1}):`, error);
      }
    }

    return {
      success: false,
      error: 'Generation timed out',
    };
  }

  private async downloadImage(filename: string, userId: string): Promise<string> {
    try {
      let imageBuffer: Buffer;

      if (isCloudMode()) {
        // Cloud: download from remote ComfyUI output
        imageBuffer = await downloadOutputFromRemoteComfy(filename, '', this.baseUrl);
      } else {
        // Local: read from disk
        const sourcePath = path.join(this.outputDir, filename);
        if (!fs.existsSync(sourcePath)) {
          throw new Error(`Generated image not found: ${filename}`);
        }
        imageBuffer = fs.readFileSync(sourcePath);
      }

      const publicFilename = `${userId}_${Date.now()}_${filename}`;
      const publicUrl = await saveGeneratedImage(imageBuffer, publicFilename);
      console.log(`🖼️ Image saved: ${publicFilename}`);
      return publicUrl;
    } catch (error) {
      console.error('Failed to download generated image:', error);
      throw new Error('Failed to download generated image');
    }
  }

  /**
   * Async variant of generate() for Vercel deployment.
   *
   * Returns a jobId immediately (< 2 s). The actual ComfyUI polling runs in
   * the background via submitAndTrack(), which writes the resultUrl to Redis
   * when done. The frontend polls GET /api/ai/job/[jobId] to pick it up.
   *
   * Falls back to direct generate() when DEPLOYMENT_TARGET !== 'vercel'
   * and VERCEL env is not set.
   */
  async generateAsync(
    request: GenerationRequest,
    jobId: string,
    feature: string,
  ): Promise<{ jobId: string; status: 'queued' }> {
    const { createJob, updateJob } = await import('@/lib/redis/aiQueue');

    await createJob({
      jobId,
      status: 'queued',
      feature,
      userId: request.userId,
    });

    // Fire and forget — submitAndTrack runs the full pipeline in background
    this.submitAndTrack(request, jobId).catch(async (err: Error) => {
      await updateJob(jobId, {
        status: 'failed',
        error: err.message,
        updatedAt: Date.now(),
      });
    });

    return { jobId, status: 'queued' };
  }

  /** Internal: runs the full generate() pipeline and writes result to Redis. */
  private async submitAndTrack(
    request: GenerationRequest,
    jobId: string,
  ): Promise<void> {
    const { updateJob } = await import('@/lib/redis/aiQueue');

    await updateJob(jobId, { status: 'processing', updatedAt: Date.now() });

    try {
      const result = await this.generate(request);
      if (result.success && result.generatedImage) {
        await updateJob(jobId, {
          status: 'done',
          resultUrl: result.generatedImage,
          updatedAt: Date.now(),
        });
      } else {
        await updateJob(jobId, {
          status: 'failed',
          error: result.error ?? 'Generation produced no output',
          updatedAt: Date.now(),
        });
      }
    } catch (err: any) {
      await updateJob(jobId, {
        status: 'failed',
        error: err.message,
        updatedAt: Date.now(),
      });
      throw err;
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/system_stats`, { timeout: 5000 });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * Flush GPU VRAM by calling ComfyUI's POST /free endpoint.
   * Critical for multi-stage pipeline on 8GB RTX 4060.
   */
  async flushVRAM(): Promise<void> {
    try {
      await axios.post(`${this.baseUrl}/free`, {
        unload_models: true,
        free_memory: true,
      });
      console.log('🧹 VRAM flushed via POST /free');
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error: any) {
      console.warn(`⚠️ VRAM flush failed (non-fatal): ${error.message}`);
    }
  }

  /**
   * Execute the full 6-stage Ultra-Pro Interior Design Pipeline.
   * Each stage runs as a separate ComfyUI prompt with VRAM flush between.
   *
   * @see lib/ai/pipeline-orchestrator.ts for stage details
   */
  async generateMultiStage(
    request: import('./pipeline-orchestrator').PipelineRequest,
    onProgress?: import('./pipeline-orchestrator').PipelineProgressCallback
  ): Promise<import('./pipeline-orchestrator').PipelineResult> {
    const { runFullPipeline } = await import('./pipeline-orchestrator');
    return runFullPipeline(request, onProgress);
  }

  /**
   * Execute the Ultra-Pro verified pipeline.
   * Uses validated node class_types from Impact Pack / IPAdapter Plus source.
   * Stages: Scene Understanding → Geometry Lock → Regional Inpaint →
   *         IPAdapter Furniture → MaskDetailer Refine → 4x-UltraSharp Upscale
   *
   * @param request Ultra-Pro pipeline request with master selector, furniture, etc.
   * @param onProgress Optional callback for real-time stage progress updates.
   * @returns Pipeline result with final image path and per-stage timings.
   */
  async generateUltraPro(
    request: import('./workflows/ultra-pro-pipeline').UltraProPipelineRequest,
    onProgress?: import('./pipeline-orchestrator').PipelineProgressCallback
  ): Promise<import('./pipeline-orchestrator').PipelineResult> {
    const { runUltraProPipeline } = await import('./pipeline-orchestrator');
    const result = await runUltraProPipeline(request, onProgress);

    // If successful, download the final image to public dir
    if (result.success && result.finalImage) {
      try {
        const publicPath = await this.downloadImage(result.finalImage, request.userId);
        result.finalImage = publicPath;
      } catch (err: any) {
        console.warn(`⚠️ Could not copy final image to public: ${err.message}`);
      }
    }

    return result;
  }
}

export const comfyUIBridge = new ComfyUIBridge();

// Re-export pipeline types for convenience
export type {
  PipelineRequest,
  PipelineResult,
  PipelineProgressCallback,
  PipelineStage,
} from './pipeline-orchestrator';

// Re-export Ultra-Pro types
export type {
  UltraProPipelineRequest,
  UltraProStage1Input,
  UltraProStage2Input,
  UltraProStage3Input,
  UltraProStage4Input,
  UltraProStage56Input,
} from './workflows/ultra-pro-pipeline';
