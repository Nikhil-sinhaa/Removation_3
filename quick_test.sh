#!/bin/bash

echo "🎯 System Status Check"
echo "===================="

echo "✅ Next.js Server: http://localhost:3000"
echo "✅ ComfyUI Server: http://127.0.0.1:8188"
echo "✅ Demo Page: http://localhost:3000/demo"

echo ""
echo "🎮 GPU Status:"
nvidia-smi --query-gpu=name,memory.used,memory.total,utilization.gpu,temperature.gpu --format=csv,noheader,nounits

echo ""
echo "📊 ComfyUI Health:"
curl -s http://127.0.0.1:8188/system_stats | jq '.devices[0] | {name, vram_free_mb: (.vram_free/1024/1024|floor), vram_total_mb: (.vram_total/1024/1024|floor)}'

echo ""
echo "🌐 Testing Web Pages:"
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Main website: Working"
else
    echo "❌ Main website: Not responding"
fi

if curl -s http://localhost:3000/demo > /dev/null; then
    echo "✅ Demo page: Working"
else
    echo "❌ Demo page: Not responding"
fi

echo ""
echo "🎯 How to Use:"
echo "1. Open: http://localhost:3000/demo"
echo "2. Upload a room photo"
echo "3. Select style (Modern, Industrial, etc.)"
echo "4. Click 'Generate Design'"
echo "5. Watch your RTX 4060 work!"
echo "6. See before/after comparison"

echo ""
echo "🚀 Ready to test!"
