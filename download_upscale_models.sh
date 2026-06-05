#!/bin/bash

# Script to download all ComfyUI models required for the upscale/inpaint workflows in "workflows upsc"
# Target destinations:
# 1. ComfyUI/models/inpaint/fooocus_inpaint_head.pth
# 2. ComfyUI/models/inpaint/inpaint_v26.fooocus.patch
# 3. ComfyUI/models/inpaint/Places_512_FullData_G.pth
# 4. ComfyUI/models/checkpoints/juggernautXL_version6Rundiffusion.safetensors

set -e

COMFYUI_MODELS_DIR="/home/nikhil/Documents/Remo2/ComfyUI/models"
INPAINT_DIR="${COMFYUI_MODELS_DIR}/inpaint"
CHECKPOINTS_DIR="${COMFYUI_MODELS_DIR}/checkpoints"

echo "🎯 Creating required model directories..."
mkdir -p "${INPAINT_DIR}"
mkdir -p "${CHECKPOINTS_DIR}"

# 1. fooocus_inpaint_head.pth
FOOOCUS_HEAD_URL="https://huggingface.co/lllyasviel/fooocus_inpaint/resolve/main/fooocus_inpaint_head.pth"
FOOOCUS_HEAD_PATH="${INPAINT_DIR}/fooocus_inpaint_head.pth"

if [ -f "${FOOOCUS_HEAD_PATH}" ] && [ -s "${FOOOCUS_HEAD_PATH}" ]; then
    echo "✅ fooocus_inpaint_head.pth already exists."
else
    echo "📥 Downloading fooocus_inpaint_head.pth..."
    wget -c "${FOOOCUS_HEAD_URL}" -O "${FOOOCUS_HEAD_PATH}" --show-progress
fi

# 2. inpaint_v26.fooocus.patch
FOOOCUS_PATCH_URL="https://huggingface.co/lllyasviel/fooocus_inpaint/resolve/main/inpaint_v26.fooocus.patch"
FOOOCUS_PATCH_PATH="${INPAINT_DIR}/inpaint_v26.fooocus.patch"

if [ -f "${FOOOCUS_PATCH_PATH}" ] && [ -s "${FOOOCUS_PATCH_PATH}" ]; then
    echo "✅ inpaint_v26.fooocus.patch already exists."
else
    echo "📥 Downloading inpaint_v26.fooocus.patch..."
    wget -c "${FOOOCUS_PATCH_URL}" -O "${FOOOCUS_PATCH_PATH}" --show-progress
fi

# 3. Places_512_FullData_G.pth (MAT model)
MAT_URL="https://github.com/Sanster/models/releases/download/add_mat/Places_512_FullData_G.pth"
MAT_PATH="${INPAINT_DIR}/Places_512_FullData_G.pth"

if [ -f "${MAT_PATH}" ] && [ -s "${MAT_PATH}" ]; then
    echo "✅ Places_512_FullData_G.pth already exists."
else
    echo "📥 Downloading Places_512_FullData_G.pth (MAT)..."
    wget -c "${MAT_URL}" -O "${MAT_PATH}" --show-progress
fi

# 4. juggernautXL_version6Rundiffusion.safetensors
JUGGERNAUT_URL="https://huggingface.co/RunDiffusion/Juggernaut-XL-v6/resolve/main/juggernautXL_version6Rundiffusion.safetensors"
JUGGERNAUT_PATH="${CHECKPOINTS_DIR}/juggernautXL_version6Rundiffusion.safetensors"

if [ -f "${JUGGERNAUT_PATH}" ] && [ -s "${JUGGERNAUT_PATH}" ]; then
    echo "✅ juggernautXL_version6Rundiffusion.safetensors already exists."
else
    echo "📥 Downloading Juggernaut-XL-v6 (7.11 GB)..."
    echo "⚠️ This is a large file and may take some time depending on your internet connection."
    wget -c "${JUGGERNAUT_URL}" -O "${JUGGERNAUT_PATH}" --show-progress
fi

echo "🎉 All required models have been successfully downloaded/verified at their correct destinations!"
