#!/bin/bash

echo "🚀 Starting Removation.ai Production Environment..."
echo "================================================"

# Start ComfyUI in background
echo "🎯 Starting ComfyUI..."
cd /home/nikhil/Documents/Remo2/ComfyUI
source venv/bin/activate
nohup python main.py --listen 127.0.0.1 --port 8188 > /tmp/comfyui.log 2>&1 &
COMFYUI_PID=$!
echo "ComfyUI PID: $COMFYUI_PID"

# Wait for ComfyUI to be ready
echo "⏳ Waiting for ComfyUI to be ready..."
for i in {1..30}; do
    if curl -s http://127.0.0.1:8188/system_stats > /dev/null; then
        echo "✅ ComfyUI is ready!"
        break
    fi
    sleep 2
done

# Start Next.js
echo "🌐 Starting Next.js..."
cd /home/nikhil/Documents/Remo2/Removation_3
npm run dev > /tmp/nextjs.log 2>&1 &
NEXTJS_PID=$!
echo "Next.js PID: $NEXTJS_PID"

# Save PIDs for management
echo "$COMFYUI_PID" > /tmp/comfyui.pid
echo "$NEXTJS_PID" > /tmp/nextjs.pid

echo ""
echo "✅ Production environment started!"
echo "   ComfyUI: http://127.0.0.1:8188"
echo "   Next.js: http://localhost:3000"
echo "   Health: http://localhost:3000/api/health/comfyui"
echo "   Dashboard: http://localhost:3000/api/monitoring/dashboard"

echo ""
echo "📊 To monitor:"
echo "   ./monitor_gpu.sh"
echo "   tail -f /tmp/comfyui.log"
echo "   tail -f /tmp/nextjs.log"
