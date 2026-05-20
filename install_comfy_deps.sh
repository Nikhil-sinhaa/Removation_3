#!/bin/bash
# =============================================================================
# Removation.ai — ComfyUI Dependency Installer
# Installs: Impact Subpack (GroundingDINO), SAM2, Depth Anything V2 weights
# Hardware: RTX 4060 8GB | ComfyUI path: /home/nikhil/Documents/Remo2/ComfyUI
# =============================================================================

set -e  # Exit on any error

COMFY_DIR="/home/nikhil/Documents/Remo2/ComfyUI"
CUSTOM_NODES="$COMFY_DIR/custom_nodes"
MODELS="$COMFY_DIR/models"
PYTHON="$COMFY_DIR/venv/bin/python3"

# Fall back to system python if no venv
if [ ! -f "$PYTHON" ]; then
  PYTHON=$(which python3)
  echo "⚠️  No ComfyUI venv found, using system python: $PYTHON"
fi

PIP="$PYTHON -m pip"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║   Removation.ai — ComfyUI Advanced Deps Installer           ║"
echo "║   ComfyUI: $COMFY_DIR"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# ── HELPER ────────────────────────────────────────────────────────────────────
check_node() {
  local name="$1"
  local dir="$CUSTOM_NODES/$name"
  if [ -d "$dir" ]; then
    echo "  ✅ $name already installed"
    return 0
  else
    echo "  ➕ Installing $name..."
    return 1
  fi
}

download_model() {
  local url="$1"
  local dest="$2"
  local name="$3"
  if [ -f "$dest" ]; then
    echo "  ✅ $name already exists"
  else
    echo "  ⬇️  Downloading $name..."
    mkdir -p "$(dirname "$dest")"
    wget -q --show-progress -O "$dest" "$url" && echo "  ✅ $name downloaded" || echo "  ❌ Failed: $name"
  fi
}

# ════════════════════════════════════════════════════════════════════════════════
echo "━━━ STEP 1: Impact Subpack (GroundingDINO + SAM loader) ━━━━━━━━━━━━━━━━━━"
# Impact Subpack provides: GroundingDinoSAMSegment, SAMLoader (for SAM v1)
if check_node "ComfyUI-Impact-Subpack"; then
  echo "  Updating to latest..."
  git -C "$CUSTOM_NODES/ComfyUI-Impact-Subpack" pull
else
  git clone https://github.com/ltdrdata/ComfyUI-Impact-Subpack.git "$CUSTOM_NODES/ComfyUI-Impact-Subpack"
  echo "  ✅ Impact Subpack cloned"
fi

# Install subpack requirements
if [ -f "$CUSTOM_NODES/ComfyUI-Impact-Subpack/requirements.txt" ]; then
  echo "  📦 Installing subpack Python deps..."
  $PIP install -q -r "$CUSTOM_NODES/ComfyUI-Impact-Subpack/requirements.txt"
fi

# ════════════════════════════════════════════════════════════════════════════════
echo ""
echo "━━━ STEP 2: GroundingDINO Python package ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if $PYTHON -c "import groundingdino" 2>/dev/null; then
  echo "  ✅ groundingdino already installed"
else
  echo "  📦 Installing groundingdino..."
  $PIP install -q "groundingdino-py" || \
  $PIP install -q "git+https://github.com/IDEA-Research/GroundingDINO.git" || \
  echo "  ⚠️  GroundingDINO pip install failed — may need manual install"
fi

# ════════════════════════════════════════════════════════════════════════════════
echo ""
echo "━━━ STEP 3: SAM2 (facebook/sam2) Python package ━━━━━━━━━━━━━━━━━━━━━━━━━"
if $PYTHON -c "import sam2" 2>/dev/null; then
  echo "  ✅ sam2 already installed"
else
  echo "  📦 Installing sam2..."
  $PIP install -q "git+https://github.com/facebookresearch/sam2.git" && \
  echo "  ✅ sam2 installed" || echo "  ❌ sam2 install failed"
fi

# ════════════════════════════════════════════════════════════════════════════════
echo ""
echo "━━━ STEP 4: Model Weights ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Create model directories
mkdir -p "$MODELS/sams"
mkdir -p "$MODELS/grounding-dino"
mkdir -p "$MODELS/ultralytics/bbox"

# ── SAM v1 (HQ) — used by SAMLoader (Impact) + GroundingDinoSAMSegment ────────
# SAM HQ gives cleaner edges than original SAM, same VRAM usage on RTX 4060
download_model \
  "https://huggingface.co/lkeab/hq-sam/resolve/main/sam_hq_vit_b.pth" \
  "$MODELS/sams/sam_hq_vit_b.pth" \
  "SAM-HQ ViT-B (360MB) — fast, fits 8GB VRAM"

# ── GroundingDINO weights ──────────────────────────────────────────────────────
download_model \
  "https://huggingface.co/ShilongLiu/GroundingDINO/resolve/main/groundingdino_swinb_cogcoor.pth" \
  "$MODELS/grounding-dino/groundingdino_swinb_cogcoor.pth" \
  "GroundingDINO SwinB (938MB)"

# GroundingDINO config (required alongside weights)
download_model \
  "https://raw.githubusercontent.com/IDEA-Research/GroundingDINO/main/groundingdino/config/GroundingDINO_SwinB_cfg.py" \
  "$MODELS/grounding-dino/GroundingDINO_SwinB_cfg.py" \
  "GroundingDINO SwinB config"

# ── Depth Anything V2 (preprocessor weight) ───────────────────────────────────
# Used by DepthAnythingV2Preprocessor node from comfyui_controlnet_aux
DEPTH_DIR="$COMFY_DIR/custom_nodes/comfyui_controlnet_aux/src/controlnet_aux/depth_anything_v2/checkpoints"
mkdir -p "$DEPTH_DIR"

download_model \
  "https://huggingface.co/depth-anything/Depth-Anything-V2-Small/resolve/main/depth_anything_v2_vits.pth" \
  "$DEPTH_DIR/depth_anything_v2_vits.pth" \
  "Depth Anything V2 ViT-S (98MB) — fast, low VRAM"

# Also save to standard ComfyUI checkpoints location (some nodes look here)
mkdir -p "$MODELS/checkpoints"
if [ ! -f "$MODELS/checkpoints/depth_anything_v2_vits.pth" ]; then
  ln -sf "$DEPTH_DIR/depth_anything_v2_vits.pth" "$MODELS/checkpoints/depth_anything_v2_vits.pth" 2>/dev/null || \
  cp "$DEPTH_DIR/depth_anything_v2_vits.pth" "$MODELS/checkpoints/depth_anything_v2_vits.pth" 2>/dev/null || true
fi

# ════════════════════════════════════════════════════════════════════════════════
echo ""
echo "━━━ STEP 5: Update existing nodes ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
for node in ComfyUI-Impact-Pack comfyui_controlnet_aux ComfyUI_IPAdapter_plus ComfyUI-KJNodes; do
  if [ -d "$CUSTOM_NODES/$node/.git" ]; then
    echo "  🔄 Updating $node..."
    git -C "$CUSTOM_NODES/$node" pull -q && echo "  ✅ $node updated" || echo "  ⚠️  $node update skipped"
  fi
done

# ════════════════════════════════════════════════════════════════════════════════
echo ""
echo "━━━ STEP 6: Verify installations ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

verify() {
  local label="$1"
  local path="$2"
  if [ -f "$path" ] || [ -d "$path" ]; then
    echo "  ✅ $label"
  else
    echo "  ❌ MISSING: $label → $path"
  fi
}

verify "Impact Pack"             "$CUSTOM_NODES/ComfyUI-Impact-Pack/__init__.py"
verify "Impact Subpack"          "$CUSTOM_NODES/ComfyUI-Impact-Subpack/__init__.py"
verify "ControlNet Aux"          "$CUSTOM_NODES/comfyui_controlnet_aux/__init__.py"
verify "IPAdapter Plus"          "$CUSTOM_NODES/ComfyUI_IPAdapter_plus/__init__.py"
verify "KJNodes"                 "$CUSTOM_NODES/ComfyUI-KJNodes/__init__.py"
verify "SAM-HQ ViT-B model"      "$MODELS/sams/sam_hq_vit_b.pth"
verify "GroundingDINO weights"   "$MODELS/grounding-dino/groundingdino_swinb_cogcoor.pth"
verify "GroundingDINO config"    "$MODELS/grounding-dino/GroundingDINO_SwinB_cfg.py"
verify "Depth Anything V2 ViTS"  "$DEPTH_DIR/depth_anything_v2_vits.pth"
verify "SDXL checkpoint"         "$MODELS/checkpoints/sd_xl_base_1.0.safetensors"
verify "CLIP Vision ViT-H"       "$MODELS/clip_vision/CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors"
verify "IPAdapter Plus SDXL"     "$MODELS/ipadapter/ip-adapter-plus_sdxl_vit-h.safetensors"
verify "Canny ControlNet SDXL"   "$MODELS/controlnet/controlnet-canny-sdxl.safetensors"
verify "RealESRGAN x4"           "$MODELS/upscale_models/RealESRGAN_x4plus.pth"

echo ""
$PYTHON -c "import groundingdino; print('  ✅ groundingdino Python package OK')" 2>/dev/null || echo "  ❌ groundingdino Python package MISSING"
$PYTHON -c "import sam2; print('  ✅ sam2 Python package OK')" 2>/dev/null || echo "  ❌ sam2 Python package MISSING"

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  ✅ Installation complete!                                   ║"
echo "║  Restart ComfyUI (./start-dev.sh) to load new nodes.        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
