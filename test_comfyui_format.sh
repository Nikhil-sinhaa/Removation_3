#!/bin/bash

echo "🔍 Testing ComfyUI Workflow Format..."
echo "===================================="

# Test 1: Minimal working workflow
echo "📤 Testing minimal workflow..."
cat > /tmp/minimal_workflow.json << 'EOF'
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
        "text": "test image",
        "clip": ["1", 1]
      },
      "class_type": "CLIPTextEncode"
    },
    "3": {
      "inputs": {
        "seed": 42,
        "steps": 5,
        "cfg": 7,
        "sampler_name": "dpmpp_2m",
        "scheduler": "karras",
        "denoise": 1.0,
        "model": ["1", 0],
        "positive": ["2", 0],
        "latent_image": ["4", 0]
      },
      "class_type": "KSampler"
    },
    "4": {
      "inputs": {
        "width": 256,
        "height": 256,
        "batch_size": 1
      },
      "class_type": "EmptyLatentImage"
    },
    "5": {
      "inputs": {
        "samples": ["3", 0],
        "vae": ["1", 2]
      },
      "class_type": "VAEDecode"
    },
    "6": {
      "inputs": {
        "filename_prefix": "test-minimal",
        "images": ["5", 0]
      },
      "class_type": "SaveImage"
    }
  }
}
EOF

RESPONSE=$(curl -s -w "%{http_code}" -X POST http://127.0.0.1:8188/prompt \
  -H "Content-Type: application/json" \
  -d @/tmp/minimal_workflow.json)

HTTP_CODE="${RESPONSE: -3}"
RESPONSE_BODY="${RESPONSE%???}"

echo "📊 HTTP Status: $HTTP_CODE"
echo "📊 Response: $RESPONSE_BODY"

if [ "$HTTP_CODE" = "200" ]; then
    PROMPT_ID=$(echo "$RESPONSE_BODY" | jq -r '.prompt_id // null')
    if [ "$PROMPT_ID" != "null" ] && [ "$PROMPT_ID" != "" ]; then
        echo "✅ Minimal workflow submitted: $PROMPT_ID"
        
        # Wait a bit and check status
        sleep 3
        STATUS_RESPONSE=$(curl -s "http://127.0.0.1:8188/history/$PROMPT_ID")
        echo "📊 Status: $STATUS_RESPONSE"
    else
        echo "❌ No prompt ID received"
    fi
else
    echo "❌ Workflow failed with HTTP $HTTP_CODE"
fi

echo ""
echo "🔍 Testing available models..."

# Test what models are available
curl -s http://127.0.0.1:8188/object_info | jq '.CheckpointLoaderSimple.input.required.ckpt_name[0]' 2>/dev/null || echo "Could not fetch models"

echo ""
echo "🔍 Testing ComfyUI system info..."

curl -s http://127.0.0.1:8188/system_stats | jq '.devices[0].name' 2>/dev/null || echo "Could not fetch system info"

# Clean up
rm -f /tmp/minimal_workflow.json

echo ""
echo "🎯 ComfyUI Format Test Complete!"
