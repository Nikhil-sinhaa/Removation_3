/**
 * Simple Test API Route for ComfyUI Generation
 * Used for testing basic generation functionality
 */

import { writeFile, mkdir, copyFile } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  try {
    console.log('🧪 Starting Simple Test generation...');
    
    // Parse form data
    const formData = await request.formData();
    const prompt = formData.get('prompt') || 'modern living room';
    const style = formData.get('style') || 'contemporary';
    const roomType = formData.get('roomType') || 'living-room';

    console.log('📝 Using basic generation without input image for testing');

    // Create basic workflow for testing
    const workflow = {
      "1": {
        "inputs": {
          "ckpt_name": "sd_xl_base_1.0.safetensors"
        },
        "class_type": "CheckpointLoaderSimple"
      },
      "2": {
        "inputs": {
          "text": `${prompt}, ${style} ${roomType}, professional photography, high quality, clean lines`,
          "clip": ["1", 1]
        },
        "class_type": "CLIPTextEncode"
      },
      "3": {
        "inputs": {
          "text": "blurry, distorted, low quality, watermark, text, cartoon, anime",
          "clip": ["1", 1]
        },
        "class_type": "CLIPTextEncode"
      },
      "4": {
        "inputs": {
          "seed": Math.floor(Math.random() * 1000000),
          "steps": 10,
          "cfg": 7,
          "sampler_name": "dpmpp_2m",
          "scheduler": "karras",
          "denoise": 1.0,
          "model": ["1", 0],
          "positive": ["2", 0],
          "negative": ["3", 0],
          "latent_image": ["5", 0]
        },
        "class_type": "KSampler"
      },
      "5": {
        "inputs": {
          "width": 512,
          "height": 512,
          "batch_size": 1
        },
        "class_type": "EmptyLatentImage"
      },
      "6": {
        "inputs": {
          "samples": ["4", 0],
          "vae": ["1", 2]
        },
        "class_type": "VAEDecode"
      },
      "7": {
        "inputs": {
          "filename_prefix": `simple_test_${Date.now()}`,
          "images": ["6", 0]
        },
        "class_type": "SaveImage"
      }
    };

    console.log('🚀 Submitting workflow to ComfyUI...');

    // Submit workflow to ComfyUI
    const response = await fetch('http://127.0.0.1:8188/prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: workflow
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    const promptId = result.prompt_id;

    if (!promptId) {
      throw new Error('No prompt_id received from ComfyUI');
    }

    console.log('🎯 Prompt ID:', promptId);

    // Wait for completion and get result
    console.log('⏳ Waiting for generation to complete...');
    
    let attempts = 0;
    const maxAttempts = 30; // 1 minute max
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      attempts++;
      
      try {
        const historyRes = await fetch(`http://127.0.0.1:8188/history/${promptId}`);
        
        if (!historyRes.ok) {
          console.error('❌ History API error:', historyRes.status);
          break;
        }
        
        const history = await historyRes.json();
        
        if (history[promptId]) {
          const promptHistory = history[promptId];
          
          if (promptHistory.status?.status_str === 'success') {
            console.log('✅ Generation completed successfully!');
            
            // Find the output image
            const outputs = promptHistory.outputs;
            if (!outputs) {
              throw new Error('No outputs found in history');
            }
            
            const nodeId = Object.keys(outputs)[0];
            const images = outputs[nodeId]?.images;
            
            if (!images || images.length === 0) {
              throw new Error('No images found in outputs');
            }
            
            const filename = images[0].filename;
            
            console.log('🖼️ Generated image:', filename);
            
            // Copy to public folder
            const sourcePath = `/home/nikhil/Documents/Remo2/ComfyUI/output/${filename}`;
            const destPath = `./public/renders/${filename}`;
            
            // Ensure public/renders directory exists
            await mkdir('./public/renders', { recursive: true });
            
            try {
              await copyFile(sourcePath, destPath);
              console.log('✅ Image copied to public/renders');
              
              return Response.json({ 
                success: true, 
                imageUrl: `/renders/${filename}`,
                filename: filename,
                promptId: promptId
              });
            } catch (copyError) {
              console.error('❌ Failed to copy image:', copyError);
              // Return success even if copy fails, image exists in ComfyUI output
              return Response.json({ 
                success: true, 
                imageUrl: `http://127.0.0.1:8188/view?filename=${filename}`,
                filename: filename,
                promptId: promptId,
                note: 'Image available in ComfyUI output only'
              });
            }
            
          } else if (promptHistory.status?.status_str === 'error') {
            console.error('❌ Generation failed');
            return Response.json({ 
              error: 'Generation failed',
              details: promptHistory.status
            }, { status: 500 });
          }
        }
        
        console.log(`📊 Progress: ${attempts}/${maxAttempts}`);
        
      } catch (historyError) {
        console.error('❌ History check error:', historyError);
        // Continue trying
      }
    }
    
    console.error('❌ Generation timeout');
    return Response.json({ 
      error: 'Generation timeout',
      promptId: promptId
    }, { status: 500 });

  } catch (error) {
    console.error('❌ Simple Test API error:', error);
    return Response.json({ 
      error: 'Generation failed', 
      message: error.message 
    }, { status: 500 });
  }
}
