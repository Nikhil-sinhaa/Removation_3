#!/bin/bash

echo "🧪 Testing Inpainting Workflow..."
echo "=============================="

# Use the existing example image
echo "📸 Using existing example image..."
EXAMPLE_IMAGE="/home/nikhil/Documents/Remo2/ComfyUI/input/example.png"

if [ ! -f "$EXAMPLE_IMAGE" ]; then
    echo "❌ Example image not found"
    exit 1
fi

echo "🎯 Creating inpainting workflow..."
cat > /tmp/inpaint_workflow.json << 'EOF'
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
        "text": "modern living room interior design, professional photography, high quality",
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
        "image": "example.png",
        "vae": ["1", 2]
      },
      "class_type": "VAEEncodeForInpaint"
    },
    "5": {
      "inputs": {
        "seed": 42,
        "steps": 15,
        "cfg": 7,
        "sampler_name": "dpmpp_2m",
        "scheduler": "karras",
        "denoise": 0.8,
        "model": ["1", 0],
        "positive": ["2", 0],
        "negative": ["3", 0],
        "latent_image": ["4", 0]
      },
      "class_type": "KSampler"
    },
    "6": {
      "inputs": {
        "samples": ["5", 0],
        "vae": ["1", 2]
      },
      "class_type": "VAEDecode"
    },
    "7": {
      "inputs": {
        "filename_prefix": "inpaint-test",
        "images": ["6", 0]
      },
      "class_type": "SaveImage"
    }
  }
}
EOF

echo "📤 Submitting inpainting workflow..."
RESPONSE=$(curl -s -X POST http://127.0.0.1:8188/prompt \
  -H "Content-Type: application/json" \
  -d @/tmp/inpaint_workflow.json)

PROMPT_ID=$(echo "$RESPONSE" | jq -r '.prompt_id')
echo "🎯 Prompt ID: $PROMPT_ID"

if [ "$PROMPT_ID" != "null" ] && [ "$PROMPT_ID" != "" ]; then
    echo "✅ Inpainting workflow submitted!"
    
    echo "⏳ Waiting for generation..."
    for i in {1..15}; do
        sleep 2
        STATUS_RESPONSE=$(curl -s "http://127.0.0.1:8188/history/$PROMPT_ID")
        
        if echo "$STATUS_RESPONSE" | jq -e ".\"$PROMPT_ID\"" > /dev/null 2>&1; then
            COMPLETED=$(echo "$STATUS_RESPONSE" | jq -r ".\"$PROMPT_ID\".status_str" 2>/dev/null)
            
            if [ "$COMPLETED" = "success" ]; then
                echo "🎉 Inpainting completed!"
                
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
                        
                        # Test if accessible via web
                        if curl -s "http://localhost:3000/generated/test_user_$OUTPUT_FILE" > /dev/null; then
                            echo "✅ Image accessible via web!"
                        else
                            echo "⚠️ Image not yet accessible via web"
                        fi
                    else
                        echo "❌ Failed to copy image to public folder"
                    fi
                    
                    break
                fi
            elif [ "$COMPLETED" = "error" ]; then
                echo "❌ Generation failed"
                break
            fi
        fi
        echo "📊 Progress: $i/15"
    done
else
    echo "❌ Failed to submit workflow"
    echo "🔍 Response: $RESPONSE"
fi

# Clean up
rm -f /tmp/inpaint_workflow.json

echo ""
echo "🎯 Inpainting Test Complete!"
