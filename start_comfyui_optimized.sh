#!/bin/bash

echo "🚀 Starting Optimized ComfyUI for RTX 4060..."
echo "=========================================="

cd /home/nikhil/Documents/Remo2/ComfyUI

# Activate virtual environment
source venv/bin/activate

# Optimized startup parameters for RTX 4060
python main.py \
    --listen 127.0.0.1 \
    --port 8188 \
    --disable-metadata \
    --gpu-only \
    --force-channels-last \
    --preview-method auto

echo "✅ ComfyUI started with RTX 4060 optimizations"
