#!/bin/bash
# =============================================================================
# Removation.ai — IC-Light Model Downloader
# Hardware: RTX 4060 8GB | ComfyUI path: /home/nikhil/Documents/Remo2/ComfyUI
# =============================================================================

set -e  # Exit on any error

COMFY_DIR="/home/nikhil/Documents/Remo2/ComfyUI"
MODELS_DIR="$COMFY_DIR/models"
CHECKPOINTS_DIR="$MODELS_DIR/checkpoints"
UNET_DIR="$MODELS_DIR/unet"
IC_LIGHT_UNET_DIR="$UNET_DIR/IC-Light"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║   Removation.ai — IC-Light Models Setup                      ║"
echo "║   ComfyUI Models: $MODELS_DIR"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Ensure target directories exist
mkdir -p "$CHECKPOINTS_DIR"
mkdir -p "$UNET_DIR"
mkdir -p "$IC_LIGHT_UNET_DIR"

# Helper function to download with wget
download_model() {
  local url="$1"
  local dest="$2"
  local name="$3"
  
  if [ -f "$dest" ]; then
    echo "✅ $name already exists at: $dest"
  else
    echo "⬇️  Downloading $name..."
    wget -c --show-progress -O "$dest" "$url"
    echo "✅ $name downloaded successfully!"
  fi
}

# 1. Download Photon v1 SD 1.5 Checkpoint (referred to as 1_5photon_v1.safetensors in single workflows)
# URL: digiplay/Photon_v1 on huggingface
download_model \
  "https://huggingface.co/digiplay/Photon_v1/resolve/main/photon_v1.safetensors" \
  "$CHECKPOINTS_DIR/1_5photon_v1.safetensors" \
  "Photon v1 SD 1.5 Checkpoint (1_5photon_v1.safetensors)"

# 2. Download Front-Conditioning IC-Light UNet Model
# URL: lllyasviel/ic-light on huggingface
download_model \
  "https://huggingface.co/lllyasviel/ic-light/resolve/main/iclight_sd15_fc.safetensors" \
  "$UNET_DIR/iclight_sd15_fc.safetensors" \
  "IC-Light Front-Conditioning UNet (iclight_sd15_fc.safetensors)"

# 3. Create symlink for the nested path (referred to as IC-Light/iclight_sd15_fc.safetensors in some workflows)
if [ ! -f "$IC_LIGHT_UNET_DIR/iclight_sd15_fc.safetensors" ]; then
  echo "🔗 Creating symlink for nested IC-Light path..."
  ln -sf "../iclight_sd15_fc.safetensors" "$IC_LIGHT_UNET_DIR/iclight_sd15_fc.safetensors"
  echo "✅ Symlink created at $IC_LIGHT_UNET_DIR/iclight_sd15_fc.safetensors"
else
  echo "✅ Symlink or file already exists at $IC_LIGHT_UNET_DIR/iclight_sd15_fc.safetensors"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  🎉 IC-Light Models download and configuration complete!     ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
