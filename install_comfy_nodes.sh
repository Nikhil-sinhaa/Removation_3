#!/bin/bash
echo "========================================"
echo "🚀 ComfyUI Advanced Nodes Installer"
echo "   (Checks before installing)"
echo "========================================"

# Go to custom_nodes directory
cd ~/ComfyUI/custom_nodes 2>/dev/null || { echo "❌ Cannot find ComfyUI/custom_nodes folder"; exit 1; }

echo "📍 Working in: $(pwd)"
echo ""

# Function to check and install
install_if_missing() {
    local repo_url=$1
    local folder_name=$2
    local nice_name=$3

    if [ -d "$folder_name" ]; then
        echo "✅ $nice_name is already installed"
    else
        echo "📥 Installing $nice_name..."
        git clone $repo_url $folder_name
        if [ $? -eq 0 ]; then
            echo "✅ Cloned $nice_name"
            if [ -f "$folder_name/requirements.txt" ]; then
                echo "📦 Installing dependencies for $nice_name..."
                pip install -r "$folder_name/requirements.txt" --quiet
            fi
        else
            echo "❌ Failed to clone $nice_name"
        fi
    fi
}

# Install Core Nodes
install_if_missing "https://github.com/ltdrdata/ComfyUI-Impact-Pack.git" "ComfyUI-Impact-Pack" "Impact-Pack (SAM2 + GroundingDINO)"
install_if_missing "https://github.com/Fannovel16/comfyui_controlnet_aux.git" "comfyui_controlnet_aux" "ControlNet Aux (Depth Anything V2)"
install_if_missing "https://github.com/cubiq/ComfyUI_IPAdapter_plus.git" "ComfyUI_IPAdapter_plus" "IPAdapter Plus"

# Install rembg (very important for Furnish tab)
echo ""
echo "🔧 Checking rembg (for furniture background removal)..."
if python -c "import rembg" &> /dev/null; then
    echo "✅ rembg is already installed"
else
    echo "📦 Installing rembg..."
    pip install rembg[cpu] onnxruntime Pillow
fi

echo ""
echo "========================================"
echo "✅ Installation process completed!"
echo "🔄 Please RESTART ComfyUI completely now."
echo "========================================"

# Optional: Restart ComfyUI command (uncomment if you want)
# echo "Restarting ComfyUI..."
# pkill -f "main.py" || true
# cd ~/ComfyUI && python main.py --lowvram --force-fp16 --preview-method taesd &
