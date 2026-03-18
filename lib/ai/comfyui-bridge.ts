// lib/ai/comfyui-bridge.ts
import fs from 'fs';
import path from 'path';
import axios from 'axios';

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
  private baseUrl: string;
  private comfyInputDir: string;

  constructor() {
    this.baseUrl = process.env.COMFY_URL || 'http://127.0.0.1:8188';
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.outputDir = process.env.COMFY_OUTPUT || '/home/nikhil/Documents/Remo2/ComfyUI/output';
    this.publicDir = path.join(process.cwd(), 'public', 'renders');
    this.comfyInputDir = process.env.COMFY_INPUT || '/home/nikhil/Documents/Remo2/ComfyUI/input';

    this.ensureDirectories();
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
      // For ComfyUI, we need to save the image to the input folder
      const imageBuffer = fs.readFileSync(imagePath);
      const filename = `upload_${Date.now()}_${path.basename(imagePath)}`;
      
      // Save to ComfyUI input directory
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
    const maxAttempts = 180; // 6 minutes max (was 2 minutes)
    const checkInterval = 2000; // 2 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await axios.get(`${this.baseUrl}/history/${promptId}`);
        const history = response.data;
        const promptHistory = history[promptId];

        if (promptHistory) {
          if (promptHistory.status?.str === 'success') {
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
          } else if (promptHistory.status?.str === 'error') {
            return {
              success: false,
              error: promptHistory.status?.msg || 'Generation failed',
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
      // Read the image from ComfyUI output directory
      const sourcePath = path.join(this.outputDir, filename);
      
      if (!fs.existsSync(sourcePath)) {
        throw new Error(`Generated image not found: ${filename}`);
      }
      
      const imageBuffer = fs.readFileSync(sourcePath);
      
      const publicFilename = `${userId}_${Date.now()}_${filename}`;
      const publicPath = path.join(this.publicDir, publicFilename);
      
      fs.writeFileSync(publicPath, imageBuffer);
      
      console.log(`🖼️ Image copied to public: ${publicFilename}`);
      return `/renders/${publicFilename}`;
    } catch (error) {
      console.error('Failed to download generated image:', error);
      throw new Error('Failed to download generated image');
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
}

export const comfyUIBridge = new ComfyUIBridge();
