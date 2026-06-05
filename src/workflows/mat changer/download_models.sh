#!/usr/bin/env bash
# =============================================================================
# Download script for re_8gb_gguf.json workflow models
# Workflow: mat changer / material changer using Qwen-Image-Edit-2509
# =============================================================================

set -e

COMFY_DIR="/home/nikhil/Documents/Remo2/ComfyUI"

echo "============================================="
echo " Downloading models for re_8gb_gguf workflow"
echo "============================================="
echo "ComfyUI path: $COMFY_DIR"
echo ""

# Create target directories
mkdir -p "$COMFY_DIR/models/unet"
mkdir -p "$COMFY_DIR/models/text_encoders"
mkdir -p "$COMFY_DIR/models/vae"
mkdir -p "$COMFY_DIR/models/loras"

# -----------------------------------------------
# 1. UNET (GGUF) — UnetLoaderGGUF
#    File: qwen-image-edit-2509.Q4_K_M.gguf  (workflow name)
#    HF:   Qwen-Image-Edit-2509-Q4_K_M.gguf
#    Size: ~13.1 GB
#    Repo: QuantStack/Qwen-Image-Edit-2509-GGUF
#    Dest: ComfyUI/models/unet/
# -----------------------------------------------
UNET_DEST="$COMFY_DIR/models/unet/qwen-image-edit-2509.Q4_K_M.gguf"
if [ -f "$UNET_DEST" ]; then
  echo "[SKIP] UNET already exists: $UNET_DEST"
else
  echo "[1/4] Downloading UNET (GGUF) — ~13.1 GB ..."
  wget --progress=bar:force -O "$UNET_DEST" \
    "https://huggingface.co/QuantStack/Qwen-Image-Edit-2509-GGUF/resolve/main/Qwen-Image-Edit-2509-Q4_K_M.gguf"
  echo "      Done."
fi

# -----------------------------------------------
# 2. CLIP / Text Encoder — CLIPLoader
#    File: qwen_2.5_vl_7b_fp8_scaled.safetensors
#    Size: ~9.38 GB
#    Repo: Comfy-Org/Qwen-Image_ComfyUI
#    Dest: ComfyUI/models/text_encoders/
# -----------------------------------------------
CLIP_DEST="$COMFY_DIR/models/text_encoders/qwen_2.5_vl_7b_fp8_scaled.safetensors"
if [ -f "$CLIP_DEST" ]; then
  echo "[SKIP] CLIP already exists: $CLIP_DEST"
else
  echo "[2/4] Downloading CLIP encoder — ~9.38 GB ..."
  wget --progress=bar:force -O "$CLIP_DEST" \
    "https://huggingface.co/Comfy-Org/Qwen-Image_ComfyUI/resolve/main/split_files/text_encoders/qwen_2.5_vl_7b_fp8_scaled.safetensors"
  echo "      Done."
fi

# -----------------------------------------------
# 3. VAE — VAELoader
#    File: qwen_image_vae.safetensors
#    Size: ~320 MB
#    Repo: Comfy-Org/Qwen-Image_ComfyUI
#    Dest: ComfyUI/models/vae/
# -----------------------------------------------
VAE_DEST="$COMFY_DIR/models/vae/qwen_image_vae.safetensors"
if [ -f "$VAE_DEST" ]; then
  echo "[SKIP] VAE already exists: $VAE_DEST"
else
  echo "[3/4] Downloading VAE — ~320 MB ..."
  wget --progress=bar:force -O "$VAE_DEST" \
    "https://huggingface.co/Comfy-Org/Qwen-Image_ComfyUI/resolve/main/split_files/vae/qwen_image_vae.safetensors"
  echo "      Done."
fi

# -----------------------------------------------
# 4. LoRA — LoraLoaderModelOnly
#    File: Qwen-Edit-2509-Multiple-angles.safetensors
#    Size: ~101 MB
#    Repo: Comfy-Org/Qwen-Image-Edit_ComfyUI
#    Dest: ComfyUI/models/loras/
# -----------------------------------------------
LORA_DEST="$COMFY_DIR/models/loras/Qwen-Edit-2509-Multiple-angles.safetensors"
if [ -f "$LORA_DEST" ]; then
  echo "[SKIP] LoRA already exists: $LORA_DEST"
else
  echo "[4/4] Downloading LoRA — ~101 MB ..."
  wget --progress=bar:force -O "$LORA_DEST" \
    "https://huggingface.co/Comfy-Org/Qwen-Image-Edit_ComfyUI/resolve/main/split_files/loras/Qwen-Edit-2509-Multiple-angles.safetensors"
  echo "      Done."
fi

echo ""
echo "============================================="
echo " All downloads complete!"
echo "============================================="
echo ""
echo "Model locations:"
echo "  UNET  : $COMFY_DIR/models/unet/qwen-image-edit-2509.Q4_K_M.gguf"
echo "  CLIP  : $COMFY_DIR/models/text_encoders/qwen_2.5_vl_7b_fp8_scaled.safetensors"
echo "  VAE   : $COMFY_DIR/models/vae/qwen_image_vae.safetensors"
echo "  LoRA  : $COMFY_DIR/models/loras/Qwen-Edit-2509-Multiple-angles.safetensors"
echo ""
echo "NOTE: Make sure ComfyUI-GGUF custom node is installed:"
echo "  cd $COMFY_DIR/custom_nodes && git clone https://github.com/city96/ComfyUI-GGUF"
