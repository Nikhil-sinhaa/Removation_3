#!/bin/bash

# ComfyUI Setup Script for Removation.ai
# This script downloads the required models for interior design generation

echo "🏠 Setting up ComfyUI models for Removation.ai..."

# Base directory
COMFYUI_DIR="/home/nikhil/Documents/Remo2/ComfyUI"
MODELS_DIR="$COMFYUI_DIR/models"

# Create directories if they don't exist
mkdir -p "$MODELS_DIR/checkpoints"
mkdir -p "$MODELS_DIR/controlnet"
mkdir -p "$MODELS_DIR/loras"
mkdir -p "$MODELS_DIR/upscale_models"
mkdir -p "$MODELS_DIR/vae"

echo "📦 Downloading SDXL Base Model..."

# Download SDXL base model
cd "$MODELS_DIR/checkpoints"
if [ ! -f "sd_xl_base_1.0.safetensors" ]; then
    wget -c "https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0/resolve/main/sd_xl_base_1.0.safetensors"
    echo "✅ SDXL Base Model downloaded"
else
    echo "✅ SDXL Base Model already exists"
fi

echo "🎛️ Downloading ControlNet Models..."

cd "$MODELS_DIR/controlnet"

# Download ControlNet models
CONTROLNET_MODELS=(
    "control_canny-fp16.safetensors"
    "control_depth-fp16.safetensors" 
    "control_scribble-fp16.safetensors"
    "control_openpose-fp16.safetensors"
    "control_seg-fp16.safetensors"
)

for model in "${CONTROLNET_MODELS[@]}"; do
    if [ ! -f "$model" ]; then
        echo "Downloading $model..."
        wget -c "https://huggingface.co/lllyasviel/ControlNet-v1-1/resolve/main/$model"
        echo "✅ $model downloaded"
    else
        echo "✅ $model already exists"
    fi
done

echo "🎨 Downloading Style LoRAs..."

cd "$MODELS_DIR/loras"

# Download style-specific LoRAs
LORA_MODELS=(
    "https://civitai.com/api/download/models/123456"  # Modern Interior LoRA (placeholder URL)
    "https://civitai.com/api/download/models/234567"  # Industrial Style LoRA (placeholder URL)
    "https://civitai.com/api/download/models/345678"  # Bohemian Style LoRA (placeholder URL)
    "https://civitai.com/api/download/models/456789"  # Minimalist Style LoRA (placeholder URL)
    "https://civitai.com/api/download/models/567890"  # Scandinavian Style LoRA (placeholder URL)
    "https://civitai.com/api/download/models/678901"  # Luxury Interior LoRA (placeholder URL)
    "https://civitai.com/api/download/models/789012"  # Indian Style LoRA (placeholder URL)
)

# Note: These are placeholder URLs - you'll need to replace them with actual LoRA URLs
echo "⚠️  LoRA URLs are placeholders - replace with actual model URLs"
echo "   You can find interior design LoRAs on CivitAI.com"

echo "🔧 Downloading Upscale Models..."

cd "$MODELS_DIR/upscale_models"

# Download Real-ESRGAN for enhancement
if [ ! -f "RealESRGAN_x4plus.pth" ]; then
    wget -c "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth"
    echo "✅ Real-ESRGAN model downloaded"
else
    echo "✅ Real-ESRGAN model already exists"
fi

echo "📋 Creating configuration files..."

# Create a workflow template
cat > "$COMFYUI_DIR/removation_workflow.json" << 'EOF'
{
  "1": {
    "inputs": {
      "ckpt_name": "sd_xl_base_1.0.safetensors"
    },
    "class_type": "CheckpointLoaderSimple"
  },
  "2": {
    "inputs": {
      "text": "interior design prompt",
      "clip": ["1", 1]
    },
    "class_type": "CLIPTextEncode"
  },
  "3": {
    "inputs": {
      "text": "blurry, distorted, low quality",
      "clip": ["1", 1]
    },
    "class_type": "CLIPTextEncode"
  },
  "4": {
    "inputs": {
      "image": "input_image.png",
      "vae": ["1", 2]
    },
    "class_type": "VAEEncodeForInpaint"
  },
  "5": {
    "inputs": {
      "seed": 42,
      "steps": 30,
      "cfg": 7,
      "sampler_name": "dpmpp_2m",
      "scheduler": "karras",
      "denoise": 0.6,
      "model": ["1", 0],
      "positive": ["2", 0],
      "negative": ["3", 0],
      "latent_image": ["4", 0]
    },
    "class_type": "KSampler"
  },
  "6": {
    "inputs": {
      "samples": ["5", 0],
      "vae": ["1", 2]
    },
    "class_type": "VAEDecode"
  },
  "7": {
    "inputs": {
      "filename_prefix": "removation-output",
      "images": ["6", 0]
    },
    "class_type": "SaveImage"
  }
}
EOF

echo "✅ Workflow template created"

# Create environment file for Next.js
cat > "/home/nikhil/Documents/Remo2/Removation_3/.env.local.comfyui" << 'EOF'
# ComfyUI Configuration
COMFYUI_URL=http://127.0.0.1:8188
COMFYUI_ENABLED=true
EOF

echo "🎯 Setup Summary:"
echo "   ✅ SDXL Base Model: $([ -f '$MODELS_DIR/checkpoints/sd_xl_base_1.0.safetensors' ] && echo 'Downloaded' || echo 'Missing')"
echo "   ✅ ControlNet Models: $(ls $MODELS_DIR/controlnet/*.safetensors 2>/dev/null | wc -l) downloaded"
echo "   ✅ Upscale Models: $([ -f '$MODELS_DIR/upscale_models/RealESRGAN_x4plus.pth' ] && echo 'Downloaded' || echo 'Missing')"
echo "   ✅ LoRAs: $(ls $MODELS_DIR/loras/*.safetensors 2>/dev/null | wc -l) downloaded"
echo ""
echo "🚀 Next Steps:"
echo "   1. Start ComfyUI: cd $COMFYUI_DIR && source venv/bin/activate && python main.py"
echo "   2. Test health: curl http://127.0.0.1:8188/system_stats"
echo "   3. Add COMFYUI_URL to your .env.local file"
echo "   4. Download interior design LoRAs from CivitAI"
echo ""
echo "💡 Pro Tip: You can test the integration with a simple API call:"
echo "   curl -X POST http://127.0.0.1:8188/prompt"
echo "        -H 'Content-Type: application/json'"
echo "        -d @removation_workflow.json"
EOF

chmod +x setup_comfyui_models.sh
