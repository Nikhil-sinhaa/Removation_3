#!/bin/bash

echo "🧪 Testing ComfyUI Bridge Fix..."
echo "================================"

# Create a test image
echo "📸 Creating test image..."
base64 -d > /tmp/test_room.png << 'EOF'
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==
EOF

echo "📤 Testing image save to ComfyUI input..."
cp /tmp/test_room.png /home/nikhil/Documents/Remo2/ComfyUI/input/test_upload.png

if [ -f "/home/nikhil/Documents/Remo2/ComfyUI/input/test_upload.png" ]; then
    echo "✅ Image saved to ComfyUI input successfully"
else
    echo "❌ Failed to save image to ComfyUI input"
    exit 1
fi

echo ""
echo "🎯 Testing simple workflow..."
cat > /tmp/simple_workflow.json << 'EOF'
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
        "text": "test room design, modern interior",
        "clip": ["1", 1]
      },
      "class_type": "CLIPTextEncode"
    },
    "3": {
      "inputs": {
        "text": "blurry, low quality",
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
        "filename_prefix": "bridge-test",
        "images": ["6", 0]
      },
      "class_type": "SaveImage"
    }
  }
}
EOF

echo "📤 Submitting workflow to ComfyUI..."
RESPONSE=$(curl -s -X POST http://127.0.0.1:8188/prompt \
  -H "Content-Type: application/json" \
  -d @/tmp/simple_workflow.json)

PROMPT_ID=$(echo "$RESPONSE" | jq -r '.prompt_id')
echo "🎯 Prompt ID: $PROMPT_ID"

if [ "$PROMPT_ID" != "null" ] && [ "$PROMPT_ID" != "" ]; then
    echo "✅ Workflow submitted successfully!"
    
    echo "⏳ Waiting for generation..."
    for i in {1..10}; do
        sleep 3
        STATUS_RESPONSE=$(curl -s "http://127.0.0.1:8188/history/$PROMPT_ID")
        
        if echo "$STATUS_RESPONSE" | jq -e ".\"$PROMPT_ID\"" > /dev/null 2>&1; then
            COMPLETED=$(echo "$STATUS_RESPONSE" | jq -r ".\"$PROMPT_ID\".status_str" 2>/dev/null)
            
            if [ "$COMPLETED" = "success" ]; then
                echo "🎉 Generation completed!"
                
                OUTPUT_FILE=$(echo "$STATUS_RESPONSE" | jq -r ".\"$PROMPT_ID\".outputs.\"7\".images[].filename" 2>/dev/null)
                
                if [ "$OUTPUT_FILE" != "" ] && [ "$OUTPUT_FILE" != "null" ]; then
                    echo "🖼️ Generated: $OUTPUT_FILE"
                    
                    # Test copying to public folder
                    PUBLIC_DIR="/home/nikhil/Documents/Remo2/Removation_3/public/generated"
                    mkdir -p "$PUBLIC_DIR"
                    
                    SOURCE="/home/nikhil/Documents/Remo2/ComfyUI/output/$OUTPUT_FILE"
                    DEST="$PUBLIC_DIR/test_user_$OUTPUT_FILE"
                    
                    if cp "$SOURCE" "$DEST"; then
                        echo "✅ Image copied to public folder"
                        echo "🌐 Available at: /generated/test_user_$OUTPUT_FILE"
                    else
                        echo "❌ Failed to copy image to public folder"
                    fi
                    
                    break
                fi
            fi
        fi
    done
else
    echo "❌ Failed to submit workflow"
    echo "🔍 Response: $RESPONSE"
fi

# Clean up
rm -f /tmp/test_room.png /tmp/simple_workflow.json

echo ""
echo "🎯 Bridge Fix Test Complete!"
