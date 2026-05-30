#!/bin/bash
set -e

echo "🧹 Stopping any existing ComfyUI processes..."
pkill -f "main.py" || true
sleep 2

echo "🚀 Starting ComfyUI with aggressive LOW MEMORY and FP8 flags..."
echo "================================================================"

cd /home/nikhil/Documents/Remo2/ComfyUI
source venv/bin/activate

# Launch with extremely low memory footprint configuration
python3 main.py \
  --listen 127.0.0.1 \
  --port 8188 \
  --preview-method taesd \
  --lowvram \
  --fp8_e4m3fn-unet \
  --disable-smart-memory \
  --cache-none \
  --disable-metadata \
  > /tmp/comfyui_lowmem.log 2>&1 &

echo "⏳ Waiting for ComfyUI to start up (10 seconds)..."
sleep 10

# Verify it is running by checking system stats
if curl -s http://127.0.0.1:8188/system_stats > /dev/null; then
  echo "✅ ComfyUI successfully started on http://127.0.0.1:8188"
else
  echo "❌ ComfyUI failed to respond. Check /tmp/comfyui_lowmem.log for details."
  cat /tmp/comfyui_lowmem.log | tail -n 20
  exit 1
fi
