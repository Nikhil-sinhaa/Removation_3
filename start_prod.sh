#!/bin/bash

echo "🚀 Starting Production Environment..."
echo "==================================="

# Check GPU availability
if ! nvidia-smi > /dev/null 2>&1; then
    echo "❌ NVIDIA GPU not available. Cannot start production."
    exit 1
fi

echo "🎯 GPU Status:"
nvidia-smi --query-gpu=name,memory.used,memory.total --format=csv,noheader

# Start ComfyUI with production settings
if ! curl -s http://127.0.0.1:8188/system_stats > /dev/null; then
    echo "🎯 Starting ComfyUI (production mode)..."
    cd /home/nikhil/Documents/Remo2/ComfyUI
    source venv/bin/activate
    nohup python main.py --listen 127.0.0.1 --port 8188 --highvram --enable-xformers --gpu-only > /var/log/comfyui.log 2>&1 &
    echo $! > /var/run/comfyui.pid
    echo "ComfyUI started with PID: $(cat /var/run/comfyui.pid)"
    
    # Wait for ComfyUI to be ready
    echo "⏳ Waiting for ComfyUI..."
    for i in {1..30}; do
        if curl -s http://127.0.0.1:8188/system_stats > /dev/null; then
            echo "✅ ComfyUI is ready!"
            break
        fi
        sleep 2
    done
else
    echo "✅ ComfyUI is already running"
fi

# Start Next.js production server
echo "🌐 Starting Next.js production server..."
cd /home/nikhil/Documents/Remo2/Removation_3
npm run build
npm start > /var/log/removation.log 2>&1 &
echo $! > /var/run/removation.pid

echo ""
echo "✅ Production Environment Started!"
echo "   ComfyUI: http://127.0.0.1:8188"
echo "   Next.js: http://localhost:3000"
echo "   Health: http://localhost:3000/api/health/comfyui"
echo ""
echo "📊 Logs:"
echo "   ComfyUI: tail -f /var/log/comfyui.log"
echo "   Removation: tail -f /var/log/removation.log"
