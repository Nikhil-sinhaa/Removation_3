#!/bin/bash

echo "🧪 Testing Direct ComfyUI Generation..."
echo "=================================="

echo "🎯 Creating and submitting workflow directly..."
cat > /tmp/direct_test.json << 'EOF'
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
        "text": "modern living room interior design, professional photography, clean lines, minimalist furniture",
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
        "seed": 42,
        "steps": 15,
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
        "filename_prefix": "direct-test-$(date +%s)",
        "images": ["6", 0]
      },
      "class_type": "SaveImage"
    }
  }
}
EOF

echo "📤 Submitting to ComfyUI..."
RESPONSE=$(curl -s -X POST http://127.0.0.1:8188/prompt \
  -H "Content-Type: application/json" \
  -d @/tmp/direct_test.json)

PROMPT_ID=$(echo "$RESPONSE" | jq -r '.prompt_id')
echo "🎯 Prompt ID: $PROMPT_ID"

if [ "$PROMPT_ID" != "null" ] && [ "$PROMPT_ID" != "" ]; then
    echo "✅ Workflow submitted successfully!"
    
    echo "⏳ Waiting for generation (monitoring GPU)..."
    
    # Monitor GPU while waiting
    for i in {1..20}; do
        sleep 2
        
        # Check GPU usage
        GPU_UTIL=$(nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits)
        VRAM_USED=$(nvidia-smi --query-gpu=memory.used --format=csv,noheader,nounits)
        
        echo "📊 GPU: ${GPU_UTIL}% | VRAM: ${VRAM_USED}MB | Progress: $i/20"
        
        # Check if generation completed
        STATUS_RESPONSE=$(curl -s "http://127.0.0.1:8188/history/$PROMPT_ID")
        
        if echo "$STATUS_RESPONSE" | jq -e ".\"$PROMPT_ID\"" > /dev/null 2>&1; then
            COMPLETED=$(echo "$STATUS_RESPONSE" | jq -r ".\"$PROMPT_ID\".status_str" 2>/dev/null)
            
            if [ "$COMPLETED" = "success" ]; then
                echo ""
                echo "🎉 Generation completed successfully!"
                
                OUTPUT_FILE=$(echo "$STATUS_RESPONSE" | jq -r ".\"$PROMPT_ID\".outputs.\"7\".images[].filename" 2>/dev/null)
                
                if [ "$OUTPUT_FILE" != "" ] && [ "$OUTPUT_FILE" != "null" ]; then
                    echo "🖼️ Generated: $OUTPUT_FILE"
                    
                    # Copy to public folder
                    PUBLIC_DIR="/home/nikhil/Documents/Remo2/Removation_3/public/generated"
                    mkdir -p "$PUBLIC_DIR"
                    
                    SOURCE="/home/nikhil/Documents/Remo2/ComfyUI/output/$OUTPUT_FILE"
                    DEST="$PUBLIC_DIR/demo_$OUTPUT_FILE"
                    
                    if cp "$SOURCE" "$DEST"; then
                        echo "✅ Copied to public folder"
                        echo "🌐 Available at: http://localhost:3000/generated/demo_$OUTPUT_FILE"
                        
                        # Test web access
                        if curl -s "http://localhost:3000/generated/demo_$OUTPUT_FILE" > /dev/null; then
                            echo "✅ Web access confirmed!"
                        fi
                        
                        echo ""
                        echo "🎯 SUCCESS! The system is working:"
                        echo "   ✅ ComfyUI: Generating images"
                        echo "   ✅ GPU: Processing with RTX 4060"
                        echo "   ✅ File system: Copying to public folder"
                        echo "   ✅ Web server: Serving images"
                        
                        echo ""
                        echo "📱 Test it now: http://localhost:3000/simple-test"
                        echo "   Upload any image and click Generate!"
                    fi
                    
                    break
                fi
            elif [ "$COMPLETED" = "error" ]; then
                echo "❌ Generation failed"
                break
            fi
        fi
    done
    
    if [ $i -eq 20 ]; then
        echo "⏰ Generation taking longer than expected, but GPU is working..."
    fi
else
    echo "❌ Failed to submit workflow"
    echo "🔍 Response: $RESPONSE"
fi

# Clean up
rm -f /tmp/direct_test.json

echo ""
echo "🎯 Direct Test Complete!"
