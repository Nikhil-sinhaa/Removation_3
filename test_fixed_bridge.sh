#!/bin/bash

echo "🧪 Testing Fixed ComfyUI Bridge..."
echo "================================"

echo "📸 Creating test image..."
base64 -d > /tmp/test_room.png << 'EOF'
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==
EOF

echo "📤 Testing the fixed bridge API..."

# Create test form data
TEMP_DIR="/tmp/comfyui_test_$$"
mkdir -p "$TEMP_DIR"

# Save the test image
base64 -d /tmp/test_room.png.base64 > "$TEMP_DIR/test_room.png" 2>/dev/null || cp /tmp/test_room.png "$TEMP_DIR/"

echo "📤 Uploading test image to fixed bridge API..."

# Test the bridge API
curl -X POST http://localhost:3000/api/simple-test/generate \
  -F "image=@$TEMP_DIR/test_room.png" \
  -F 'data={
    "mode": "redesign",
    "style": "modern", 
    "roomType": "living_room",
    "prompt": "modern living room redesign",
    "settings": {
      "creativity": 50,
      "preserveLayout": true,
      "enhanceQuality": true,
      "num_inference_steps": 15,
      "guidance_scale": 7,
      "strength": 0.6
    }
  }' \
  -s | jq '.' > /tmp/bridge_response.json

echo "📊 Bridge API Response:"
cat /tmp/bridge_response.json | jq '.'

# Check if successful
SUCCESS=$(cat /tmp/bridge_response.json | jq -r '.success // false')

if [ "$SUCCESS" = "true" ]; then
    echo "✅ Bridge API call successful!"
    
    # Check if image was generated
    sleep 5 # Give it time to process
    
    echo "🔍 Checking for generated images..."
    ls -la /home/nikhil/Documents/Remo2/Removation_3/public/generated/*.png | tail -3
    
    echo "🌐 Testing web access..."
    for file in /home/nikhil/Documents/Remo2/Removation_3/public/generated/*.png; do
        filename=$(basename "$file")
        if curl -s "http://localhost:3000/generated/$filename" > /dev/null; then
            echo "✅ Image accessible: http://localhost:3000/generated/$filename"
        fi
    done
    
else
    echo "❌ Bridge API call failed"
    ERROR=$(cat /tmp/bridge_response.json | jq -r '.error // "Unknown error"')
    echo "🔍 Error: $ERROR"
fi

# Clean up
rm -rf "$TEMP_DIR"
rm -f /tmp/test_room.png /tmp/bridge_response.json

echo ""
echo "🎯 Fixed Bridge Test Complete!"
