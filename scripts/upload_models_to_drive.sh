#!/bin/bash
# upload_models_to_drive.sh
# ─────────────────────────────────────────────────────────────────────────────
# Run this ONCE to upload your local ComfyUI models to Google Drive.
# After this, the Colab notebook uses Drive directly via symlinks — no
# re-uploading needed on subsequent Colab sessions.
#
# Requirements:
#   - rclone installed:  curl https://rclone.org/install.sh | sudo bash
#   - rclone configured: rclone config  (choose Google Drive, name it "gdrive")
#
# Usage:
#   bash scripts/upload_models_to_drive.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e

COMFYUI_PATH="/home/nikhil/Documents/Remo2/ComfyUI"
DRIVE_DEST="gdrive:ComfyUI_Models"

echo "============================================================"
echo "  Removation — ComfyUI Model Upload to Google Drive"
echo "  Source: $COMFYUI_PATH"
echo "  Dest:   $DRIVE_DEST"
echo "============================================================"
echo ""
echo "This runs ONCE. After this, Colab uses Drive directly via"
echo "symlinks — startup takes ~5 minutes (not hours)."
echo ""

# Check rclone is installed
RCLONE_BIN="rclone"
if ! command -v rclone &> /dev/null; then
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  if [ -f "$SCRIPT_DIR/rclone" ]; then
    RCLONE_BIN="$SCRIPT_DIR/rclone"
  else
    echo "❌ rclone not found. Setup local rclone first:"
    echo "   bash scripts/setup_rclone.sh"
    echo "   Then run: ./scripts/rclone config"
    exit 1
  fi
fi

# Upload model directories
for folder in checkpoints loras vae embeddings controlnet upscale_models; do
  src="$COMFYUI_PATH/models/$folder"
  if [ -d "$src" ]; then
    echo "📤 Uploading $folder..."
    "$RCLONE_BIN" copy "$src" "$DRIVE_DEST/$folder" --progress --transfers 1
    echo "✅ $folder done"
  else
    echo "⚠️  $folder not found at $src — skipping"
  fi
  echo ""
done

# Upload custom nodes (exclude .pyc and __pycache__)
echo "📤 Uploading custom nodes..."
"$RCLONE_BIN" copy \
  "$COMFYUI_PATH/custom_nodes" \
  "$DRIVE_DEST/custom_nodes" \
  --progress \
  --transfers 1 \
  --exclude "*.pyc" \
  --exclude "__pycache__/**" \
  --exclude ".git/**"
echo "✅ Custom nodes done"

echo ""
echo "============================================================"
echo "✅ Upload complete!"
echo ""
echo "Next steps:"
echo "  1. Open scripts/RemovationColab.ipynb"
echo "  2. Upload to your Google Drive"
echo "  3. Open in Colab → Runtime → Change runtime type → T4 GPU"
echo "  4. Runtime → Run all"
echo "  5. Copy the trycloudflare.com URL from Cell 4"
echo "  6. Paste in Dashboard → Settings → GPU"
echo "  7. Set mode to AUTO → Save"
echo "============================================================"
