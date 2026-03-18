export async function POST() {
  try {
    console.log('🧪 Testing ComfyUI connection...');
    
    // Test basic workflow submission
    const workflow = {
      "1": {
        "inputs": {
          "ckpt_name": "sd_xl_base_1.0.safetensors"
        },
        "class_type": "CheckpointLoaderSimple"
      },
      "2": {
        "inputs": {
          "text": "test",
          "clip": ["1", 1]
        },
        "class_type": "CLIPTextEncode"
      },
      "3": {
        "inputs": {
          "text": "blurry",
          "clip": ["1", 1]
        },
        "class_type": "CLIPTextEncode"
      },
      "4": {
        "inputs": {
          "seed": 42,
          "steps": 5,
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
          "filename_prefix": "test",
          "images": ["6", 0]
        },
        "class_type": "SaveImage"
      }
    };

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
    
    return Response.json({ 
      success: true, 
      promptId: result.prompt_id,
      message: 'Workflow submitted successfully'
    });

  } catch (error) {
    console.error('❌ Test ComfyUI error:', error);
    return Response.json({ 
      error: 'Test failed', 
      message: error.message 
    }, { status: 500 });
  }
}
