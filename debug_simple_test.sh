#!/bin/bash

echo "🔍 Debugging Simple Test API..."
echo "=============================="

# Create a proper test image
echo "📸 Creating test image..."
convert -size 100x100 xc:blue /tmp/test_blue.png 2>/dev/null || {
  # Fallback if ImageMagick not available
  base64 -d > /tmp/test_blue.png << 'EOF'
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==
EOF
}

echo "📤 Testing simple-test API with proper workflow..."

# Test the API directly
RESPONSE=$(curl -s -X POST http://localhost:3000/api/simple-test/generate \
  -F "image=@/tmp/test_blue.png" \
  -F 'data={
    "mode": "redesign",
    "style": "modern",
    "roomType": "living_room",
    "prompt": "modern living room design",
    "negative_prompt": "blurry, low quality",
    "settings": {
      "creativity": 50,
      "num_inference_steps": 10,
      "guidance_scale": 7
    }
  }')

echo "📊 Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

# Check if it's the workflow issue
echo ""
echo "🔍 Testing if the issue is in our workflow format..."

# Create a known working workflow
cat > /tmp/working_workflow.json << 'EOF'
{
  "prompt": {
    "1": {
      "inputs": {
        "ckpt_name": "sd_xl_base_1.0.safetensors"
      },
      "class_type": "CheckpointLoaderSimple"
    },
    "2": {
      "inputs": {
        "text": "modern living room design, professional photography, high quality",
        "clip": ["1", 1]
      },
      "class_type": "CLIPTextEncode"
    },
    "3": {
      "inputs": {
        "text": "blurry, distorted, low quality, watermark, text",
        "clip": ["1", 1]
      },
      "class_type": "CLIPTextEncode"
    },
    "4": {
      "inputs": {
        "seed": 42,
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
        "width": 256,
        "height": 256,
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
        "filename_prefix": "debug-test",
        "images": ["6", 0]
      },
      "class_type": "SaveImage"
    }
  }
}
EOF

# Test this workflow directly with ComfyUI
echo "📤 Testing workflow directly with ComfyUI..."
COMFYUI_RESPONSE=$(curl -s -w "%{http_code}" -X POST http://127.0.0.1:8188/prompt \
  -H "Content-Type: application/json" \
  -d @/tmp/working_workflow.json)

HTTP_CODE="${COMFYUI_RESPONSE: -3}"
RESPONSE_BODY="${COMFYUI_RESPONSE%???}"

echo "📊 ComfyUI HTTP Status: $HTTP_CODE"
echo "📊 ComfyUI Response: $RESPONSE_BODY"

if [ "$HTTP_CODE" = "200" ]; then
    PROMPT_ID=$(echo "$RESPONSE_BODY" | jq -r '.prompt_id // null')
    if [ "$PROMPT_ID" != "null" ]; then
        echo "✅ Workflow submitted to ComfyUI: $PROMPT_ID"
        
        # Wait for completion
        echo "⏳ Waiting for completion..."
        for i in {1..10}; do
            sleep 2
            STATUS=$(curl -s "http://127.0.0.1:8188/history/$PROMPT_ID" | jq -r ".\"$PROMPT_ID\".status.str // null")
            if [ "$STATUS" = "success" ]; then
                echo "✅ Generation completed!"
                break
            elif [ "$STATUS" = "error" ]; then
                echo "❌ Generation failed"
                break
            fi
            echo "📊 Progress: $i/10"
        done
    fi
else
    echo "❌ Workflow submission failed"
fi

# Clean up
rm -f /tmp/test_blue.png /tmp/working_workflow.json

echo ""
echo "🎯 Debug test complete!"
