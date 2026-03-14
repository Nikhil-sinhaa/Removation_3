#!/bin/bash

echo "🧪 System Health Test"
echo "==================="

echo "1. GPU Status:"
nvidia-smi --query-gpu=name,memory.used,memory.total,utilization.gpu,temperature.gpu --format=csv,noheader,nounits

echo ""
echo "2. ComfyUI Status:"
if curl -s http://127.0.0.1:8188/system_stats > /dev/null; then
    echo "✅ ComfyUI is running"
    curl -s http://127.0.0.1:8188/system_stats | jq '.devices[0] | {name, vram_free, vram_total}'
else
    echo "❌ ComfyUI is not running"
fi

echo ""
echo "3. Next.js Status:"
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Next.js is running"
else
    echo "❌ Next.js is not running"
fi

echo ""
echo "4. Health Check:"
if curl -s http://localhost:3000/api/health/comfyui > /dev/null; then
    echo "✅ Health check API working"
    curl -s http://localhost:3000/api/health/comfyui | jq '.status, .gpu.vram_usage_percent, .comfyui.queue_size'
else
    echo "❌ Health check API not responding"
fi

echo ""
echo "5. Model Files:"
echo "   SDXL: $(ls -lh /home/nikhil/Documents/Remo2/ComfyUI/models/checkpoints/*.safetensors 2>/dev/null | wc -l) files"
echo "   ControlNet: $(ls -lh /home/nikhil/Documents/Remo2/ComfyUI/models/controlnet/*.safetensors 2>/dev/null | wc -l) files"
echo "   LoRAs: $(ls -lh /home/nikhil/Documents/Remo2/ComfyUI/models/loras/*.safetensors 2>/dev/null | wc -l) files"

echo ""
echo "🎯 System Test Complete!"
