#!/bin/bash

echo "🖥️ GPU Performance Monitor"
echo "========================="

while true; do
    clear
    echo "📊 Real-time GPU Stats:"
    echo "===================="
    
    # GPU utilization
    GPU_UTIL=$(nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits)
    MEMORY_USED=$(nvidia-smi --query-gpu=memory.used --format=csv,noheader,nounits)
    MEMORY_TOTAL=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits)
    TEMPERATURE=$(nvidia-smi --query-gpu=temperature.gpu --format=csv,noheader,nounits)
    
    echo "🎯 GPU Utilization: ${GPU_UTIL}%"
    echo "💾 VRAM Usage: ${MEMORY_USED}MB / ${MEMORY_TOTAL}MB"
    echo "🌡️ Temperature: ${TEMPERATURE}°C"
    
    # Memory usage bar
    MEMORY_PERCENT=$((MEMORY_USED * 100 / MEMORY_TOTAL))
    BAR_LENGTH=50
    FILLED_LENGTH=$((MEMORY_PERCENT * BAR_LENGTH / 100))
    
    printf "["
    for ((i=0; i<FILLED_LENGTH; i++)); do printf "█"; done
    for ((i=FILLED_LENGTH; i<BAR_LENGTH; i++)); do printf " "; done
    printf "] %d%%\n" $MEMORY_PERCENT
    
    echo ""
    echo "🔄 ComfyUI Queue Status:"
    curl -s http://127.0.0.1:8188/queue | jq '.queue_running | length' 2>/dev/null | xargs echo "  Running:" || echo "  Running: 0"
    curl -s http://127.0.0.1:8188/queue | jq '.queue_pending | length' 2>/dev/null | xargs echo "  Pending:" || echo "  Pending: 0"
    
    echo ""
    echo "⚡ Performance Tips:"
    echo "   - Keep GPU temp below 80°C"
    echo "   - VRAM usage should stay under 7GB"
    echo "   - Utilization 80-95% is optimal"
    
    sleep 2
done
