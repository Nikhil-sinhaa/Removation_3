#!/bin/bash
# -----------------------------------------------------------------------------
# ComfyUI Required Models Setup & Download Script
# Sets up SDXL compatibility symlinks and fetches missing auxiliary models.
# -----------------------------------------------------------------------------

set -e

BASE_DIR="/home/nikhil/Documents/Remo2"
cd "$BASE_DIR"

echo "=== [1/4] Configuring SDXL Base Model Compatibility Symlinks ==="
# Symlink legacy/alternative SDXL names to standard sd_xl_base_1.0 to save 13GB of storage
cd "ComfyUI/models/checkpoints"
if [ -f "sd_xl_base_1.0.safetensors" ]; then
    echo "Linking juggernautXL_version6Rundiffusion.safetensors..."
    ln -sf "sd_xl_base_1.0.safetensors" "juggernautXL_version6Rundiffusion.safetensors"
    echo "Linking sd_xl_base_1.0_0.9vae.safetensors..."
    ln -sf "sd_xl_base_1.0.safetensors" "sd_xl_base_1.0_0.9vae.safetensors"
    echo "✓ SDXL base compatibility links created successfully."
else
    echo "⚠️ Warning: sd_xl_base_1.0.safetensors not found! Compatibility links skipped."
fi
cd "$BASE_DIR"

echo "=== [2/4] Downloading SDXL VAE ==="
mkdir -p "ComfyUI/models/vae"
VAE_PATH="ComfyUI/models/vae/sdxl_vae.safetensors"
if [ ! -f "$VAE_PATH" ] || [ ! -s "$VAE_PATH" ]; then
    echo "Downloading sdxl_vae.safetensors..."
    wget -c --show-progress -O "$VAE_PATH" "https://huggingface.co/stabilityai/sdxl-vae/resolve/main/sdxl_vae.safetensors"
    echo "✓ VAE download complete."
else
    echo "✓ VAE already present."
fi

echo "=== [3/4] Downloading DepthAnything V2 Large Model ==="
LARGE_DEPTH_DIR="ComfyUI/custom_nodes/comfyui_controlnet_aux/ckpts/depth-anything/Depth-Anything-V2-Large"
mkdir -p "$LARGE_DEPTH_DIR"
LARGE_DEPTH_PATH="$LARGE_DEPTH_DIR/depth_anything_v2_vitl.pth"

if [ ! -f "$LARGE_DEPTH_PATH" ] || [ ! -s "$LARGE_DEPTH_PATH" ]; then
    echo "Downloading depth_anything_v2_vitl.pth..."
    wget -c --show-progress -O "$LARGE_DEPTH_PATH" "https://huggingface.co/depth-anything/Depth-Anything-V2-Large/resolve/main/depth_anything_v2_vitl.pth"
    echo "✓ DepthAnything V2 Large download complete."
else
    echo "✓ DepthAnything V2 Large already present."
fi

echo "=== [4/4] Creating Symlinks for DepthAnything V2 Large ==="
# Ensure both standard checkpoints folder and controlnet_aux depth_anything_v2 checkpoint directories can access it
mkdir -p "ComfyUI/custom_nodes/comfyui_controlnet_aux/src/controlnet_aux/depth_anything_v2/checkpoints"

echo "Linking in ComfyUI checkpoints directory..."
ln -sf "$BASE_DIR/$LARGE_DEPTH_PATH" "ComfyUI/models/checkpoints/depth_anything_v2_vitl.pth"

echo "Linking in controlnet_aux checkpoints directory..."
ln -sf "$BASE_DIR/$LARGE_DEPTH_PATH" "ComfyUI/custom_nodes/comfyui_controlnet_aux/src/controlnet_aux/depth_anything_v2/checkpoints/depth_anything_v2_vitl.pth"

echo "=== 🌟 All Required Models Successfully Setup! 🌟 ==="
