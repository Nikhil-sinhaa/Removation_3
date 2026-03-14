#!/bin/bash

echo "🛠️ Starting Development Environment..."
echo "===================================="

# Check if ComfyUI is running
if ! curl -s http://127.0.0.1:8188/system_stats > /dev/null; then
    echo "🎯 Starting ComfyUI..."
    cd /home/nikhil/Documents/Remo2/ComfyUI
    source venv/bin/activate
    python main.py --listen 127.0.0.1 --port 8188 &
    COMFYUI_PID=$!
    echo "ComfyUI PID: $COMFYUI_PID"
    
    # Wait for ComfyUI to be ready
    echo "⏳ Waiting for ComfyUI..."
    for i in {1..15}; do
        if curl -s http://127.0.0.1:8188/system_stats > /dev/null; then
            echo "✅ ComfyUI is ready!"
            break
        fi
        sleep 2
    done
else
    echo "✅ ComfyUI is already running"
fi

# Start Next.js development server
echo "🌐 Starting Next.js development server..."
cd /home/nikhil/Documents/Remo2/Removation_3
npm run dev

echo ""
echo "🎯 Development Environment Ready!"
echo "   ComfyUI: http://127.0.0.1:8188"
echo "   Next.js: http://localhost:3000"
