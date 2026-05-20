#!/bin/bash

# Scene Understanding Dependencies Installation Script
# Checks for existing dependencies and only downloads what's missing
# Optimized for RTX 4060 8GB and Indian home interiors

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMFYUI_DIR="/home/nikhil/Documents/Remo2/ComfyUI"
CUSTOM_NODES_DIR="$COMFYUI_DIR/custom_nodes"
MODELS_DIR="$COMFYUI_DIR/models"
GROUNDING_DINO_DIR="$MODELS_DIR/grounding-dino"
SAM2_DIR="$MODELS_DIR/sam2"
DEPTH_DIR="$MODELS_DIR/depth_anything"

echo -e "${BLUE}🔍 Scene Understanding Dependencies Installer${NC}"
echo -e "${BLUE}==========================================${NC}"
echo ""

# Function to check if directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✅ Found: $1${NC}"
        return 0
    else
        echo -e "${YELLOW}❌ Missing: $1${NC}"
        return 1
    fi
}

# Function to check if file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅ Found: $(basename $1)${NC}"
        return 0
    else
        echo -e "${YELLOW}❌ Missing: $(basename $1)${NC}"
        return 1
    fi
}

# Function to create directory if missing
ensure_dir() {
    if [ ! -d "$1" ]; then
        echo -e "${BLUE}📁 Creating: $1${NC}"
        mkdir -p "$1"
    fi
}

# Function to download with progress
download_with_progress() {
    local url="$1"
    local output="$2"
    local description="$3"
    
    echo -e "${BLUE}⬇️  Downloading: $description${NC}"
    if command -v wget >/dev/null 2>&1; then
        wget --progress=bar:force -O "$output" "$url"
    elif command -v curl >/dev/null 2>&1; then
        curl -L --progress-bar -o "$output" "$url"
    else
        echo -e "${RED}❌ Neither wget nor curl found. Please install one.${NC}"
        exit 1
    fi
}

echo -e "${BLUE}🔍 Checking ComfyUI installation...${NC}"
if ! check_dir "$COMFYUI_DIR"; then
    echo -e "${RED}❌ ComfyUI not found at $COMFYUI_DIR${NC}"
    echo -e "${YELLOW}Please install ComfyUI first:${NC}"
    echo -e "${BLUE}git clone https://github.com/comfyanonymous/ComfyUI.git $COMFYUI_DIR${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📦 Checking required directories...${NC}"
ensure_dir "$CUSTOM_NODES_DIR"
ensure_dir "$GROUNDING_DINO_DIR"
ensure_dir "$SAM2_DIR"
ensure_dir "$DEPTH_DIR"

echo ""
echo -e "${BLUE}🔌 Checking custom nodes...${NC}"

# Check ComfyUI-SAM2
SAM2_NODE_DIR="$CUSTOM_NODES_DIR/ComfyUI-SAM2"
if check_dir "$SAM2_NODE_DIR"; then
    echo -e "${GREEN}✅ ComfyUI-SAM2 already installed${NC}"
else
    echo -e "${YELLOW}📦 Installing ComfyUI-SAM2...${NC}"
    cd "$CUSTOM_NODES_DIR"
    git clone https://github.com/neverbiasu/ComfyUI-SAM2.git
    echo -e "${GREEN}✅ ComfyUI-SAM2 installed${NC}"
fi

# Check ComfyUI-DepthAnythingV2  
DEPTH_NODE_DIR="$CUSTOM_NODES_DIR/ComfyUI-DepthAnythingV2"
if check_dir "$DEPTH_NODE_DIR"; then
    echo -e "${GREEN}✅ ComfyUI-DepthAnythingV2 already installed${NC}"
else
    echo -e "${YELLOW}📦 Installing ComfyUI-DepthAnythingV2...${NC}"
    cd "$CUSTOM_NODES_DIR"
    git clone https://github.com/kijai/ComfyUI-DepthAnythingV2.git
    echo -e "${GREEN}✅ ComfyUI-DepthAnythingV2 installed${NC}"
fi

# Check ComfyUI Impact Pack (includes GroundingDINO)
IMPACT_DIR="$CUSTOM_NODES_DIR/ComfyUI-Impact-Pack"
if check_dir "$IMPACT_DIR"; then
    echo -e "${GREEN}✅ ComfyUI Impact Pack already installed${NC}"
else
    echo -e "${YELLOW}📦 Installing ComfyUI Impact Pack...${NC}"
    cd "$CUSTOM_NODES_DIR"
    git clone https://github.com/ltdrdata/ComfyUI-Impact-Pack.git
    echo -e "${GREEN}✅ ComfyUI Impact Pack installed${NC}"
fi

echo ""
echo -e "${BLUE}🧠 Checking AI models...${NC}"

# GroundingDINO Models
echo -e "${BLUE}🔍 Checking GroundingDINO models...${NC}"
GROUNDING_DINO_CONFIG="$GROUNDING_DINO_DIR/GroundingDINO_SwinT_OGC.py"
GROUNDING_DINO_WEIGHTS="$GROUNDING_DINO_DIR/groundingdino_swint_ogc.pth"

if ! check_file "$GROUNDING_DINO_CONFIG"; then
    echo -e "${YELLOW}📥 Downloading GroundingDINO config...${NC}"
    download_with_progress \
        "https://huggingface.co/ShilongLiu/GroundingDINO/resolve/main/GroundingDINO_SwinT_OGC.py" \
        "$GROUNDING_DINO_CONFIG" \
        "GroundingDINO Config"
fi

if ! check_file "$GROUNDING_DINO_WEIGHTS"; then
    echo -e "${YELLOW}📥 Downloading GroundingDINO weights...${NC}"
    download_with_progress \
        "https://huggingface.co/ShilongLiu/GroundingDINO/resolve/main/groundingdino_swint_ogc.pth" \
        "$GROUNDING_DINO_WEIGHTS" \
        "GroundingDINO Weights (~700MB)"
fi

# SAM2 Models
echo -e "${BLUE}🔍 Checking SAM2 models...${NC}"
SAM2_HUGE="$SAM2_DIR/sam2_huge.pt"
SAM2_BASE="$SAM2_DIR/sam2_base.pt"

# Try to download huge model first (better quality), fallback to base if needed
if ! check_file "$SAM2_HUGE"; then
    echo -e "${YELLOW}📥 Downloading SAM2 Huge model (~2.5GB)...${NC}"
    if download_with_progress \
        "https://dl.fbaipublicfiles.com/segment_anything_2/072824/sam2_huge.pt" \
        "$SAM2_HUGE" \
        "SAM2 Huge Model"; then
        echo -e "${GREEN}✅ SAM2 Huge model downloaded${NC}"
    else
        echo -e "${YELLOW}⚠️  Failed to download huge model, trying base model...${NC}"
        if ! check_file "$SAM2_BASE"; then
            echo -e "${YELLOW}📥 Downloading SAM2 Base model (~600MB)...${NC}"
            download_with_progress \
                "https://dl.fbaipublicfiles.com/segment_anything_2/072824/sam2_base.pt" \
                "$SAM2_BASE" \
                "SAM2 Base Model"
        fi
    fi
fi

# Depth Anything V2 Models
echo -e "${BLUE}🔍 Checking Depth Anything V2 models...${NC}"
DEPTH_LARGE="$DEPTH_DIR/depth_anything_v2_vitl14.pt"
DEPTH_SMALL="$DEPTH_DIR/depth_anything_v2_vits14.pt"

if ! check_file "$DEPTH_LARGE"; then
    echo -e "${YELLOW}📥 Downloading Depth Anything V2 Large model (~1.3GB)...${NC}"
    if download_with_progress \
        "https://huggingface.co/depth-anything/Depth-Anything-V2-Large/resolve/main/depth_anything_v2_vitl14.pt" \
        "$DEPTH_LARGE" \
        "Depth Anything V2 Large Model"; then
        echo -e "${GREEN}✅ Depth Anything V2 Large model downloaded${NC}"
    else
        echo -e "${YELLOW}⚠️  Failed to download large model, trying small model...${NC}"
        if ! check_file "$DEPTH_SMALL"; then
            echo -e "${YELLOW}📥 Downloading Depth Anything V2 Small model (~400MB)...${NC}"
            download_with_progress \
                "https://huggingface.co/depth-anything/Depth-Anything-V2-Small/resolve/main/depth_anything_v2_vits14.pt" \
                "$DEPTH_SMALL" \
                "Depth Anything V2 Small Model"
        fi
    fi
fi

echo ""
echo -e "${BLUE}📦 Installing Python dependencies...${NC}"
cd "$COMFYUI_DIR"

# Check if requirements.txt needs updating
if [ -f "requirements.txt" ]; then
    echo -e "${GREEN}✅ requirements.txt found${NC}"
else
    echo -e "${YELLOW}⚠️  requirements.txt not found, creating basic one...${NC}"
    echo "torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118" > requirements.txt
    echo "opencv-python" >> requirements.txt
    echo "numpy" >> requirements.txt
    echo "pillow" >> requirements.txt
fi

echo -e "${BLUE}🔄 Updating pip and installing dependencies...${NC}"
pip install --upgrade pip
pip install -r requirements.txt

# Install additional dependencies for scene understanding
echo -e "${BLUE}📦 Installing scene understanding specific dependencies...${NC}"
pip install supervision segment-anything-2 grounding-dino-py

echo ""
echo -e "${BLUE}🔧 Setting up model configurations...${NC}"

# Create model info files for easy reference
cat > "$GROUNDING_DINO_DIR/model_info.txt" <<EOF
GroundingDINO Models for Scene Understanding
==========================================
Config: GroundingDINO_SwinT_OGC.py
Weights: groundingdino_swint_ogc.pth
Purpose: Object detection for Indian home interiors
Optimized for: Clutter, traditional items, furniture
EOF

cat > "$SAM2_DIR/model_info.txt" <<EOF
SAM2 Models for Scene Understanding
==================================
Huge: sam2_huge.pt (best quality, more VRAM)
Base: sam2_base.pt (good quality, less VRAM)
Purpose: High-quality segmentation
Optimized for: RTX 4060 8GB (dynamic selection)
EOF

cat > "$DEPTH_DIR/model_info.txt" <<EOF
Depth Anything V2 Models for Scene Understanding
=============================================
Large: depth_anything_v2_vitl14.pt (best accuracy)
Small: depth_anything_v2_vits14.pt (faster, less VRAM)
Purpose: Depth estimation for Indian homes
Optimized for: Reflective surfaces, complex lighting
EOF

echo ""
echo -e "${GREEN}🎉 Installation Complete!${NC}"
echo -e "${GREEN}============================${NC}"
echo ""

echo -e "${BLUE}📋 Summary:${NC}"
echo -e "${GREEN}✅ Custom Nodes:${NC}"
echo -e "   - ComfyUI-SAM2: $(check_dir "$SAM2_NODE_DIR" && echo "Installed" || echo "Failed")"
echo -e "   - ComfyUI-DepthAnythingV2: $(check_dir "$DEPTH_NODE_DIR" && echo "Installed" || echo "Failed")"
echo -e "   - ComfyUI Impact Pack: $(check_dir "$IMPACT_DIR" && echo "Installed" || echo "Failed")"

echo -e "${GREEN}✅ Models:${NC}"
echo -e "   - GroundingDINO: $(check_file "$GROUNDING_DINO_WEIGHTS" && echo "Downloaded" || echo "Failed")"
echo -e "   - SAM2: $(check_file "$SAM2_HUGE" && echo "Huge Ready" || (check_file "$SAM2_BASE" && echo "Base Ready" || echo "Failed"))"
echo -e "   - Depth Anything V2: $(check_file "$DEPTH_LARGE" && echo "Large Ready" || (check_file "$DEPTH_SMALL" && echo "Small Ready" || echo "Failed"))"

echo ""
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo -e "1. Start ComfyUI: cd $COMFYUI_DIR && python main.py --listen 0.0.0.0 --port 8188"
echo -e "2. Open browser: http://127.0.0.1:8188"
echo -e "3. Load scene understanding workflow from: /home/nikhil/Documents/Remo2/Removation_3/src/workflows/"
echo -e "4. Test with Indian home interior images"

echo ""
echo -e "${YELLOW}⚠️  Memory Optimization Notes:${NC}"
echo -e "- For RTX 4060 8GB: Use 'balanced' quality setting"
echo -e "- If OOM occurs: Use 'fast' quality or disable depth estimation"
echo -e "- Large models (SAM2 Huge, Depth V2 Large) require ~6GB VRAM"

echo ""
echo -e "${GREEN}✨ Scene understanding workflow is ready for Indian home interiors!${NC}"
