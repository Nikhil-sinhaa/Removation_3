#!/bin/bash
# setup_rclone.sh
# ─────────────────────────────────────────────────────────────────────────────
# Downloads and extracts rclone locally to enable high-speed multithreaded 
# model uploads without requiring sudo/root access.
# ─────────────────────────────────────────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$(dirname "$SCRIPT_DIR")"

echo "============================================================"
echo "  Removation — Local High-Speed rclone Installer"
echo "============================================================"
echo ""

# 1. Download latest rclone zip
echo "📥 Downloading rclone-current-linux-amd64.zip..."
curl -L -o "$WORKSPACE_DIR/rclone-current.zip" "https://downloads.rclone.org/rclone-current-linux-amd64.zip"

# 2. Extract using Python (failsafe if unzip is missing)
echo "📦 Extracting package..."
python3 -c "
import zipfile, os
with zipfile.ZipFile('$WORKSPACE_DIR/rclone-current.zip', 'r') as zip_ref:
    zip_ref.extractall('$WORKSPACE_DIR/rclone-temp')
"

# 3. Relocate binary
echo "⚙️  Configuring executable..."
RCLONE_EXTRACTED_DIR=$(find "$WORKSPACE_DIR/rclone-temp" -mindepth 1 -maxdepth 1 -type d | head -n 1)
cp "$RCLONE_EXTRACTED_DIR/rclone" "$SCRIPT_DIR/rclone"
chmod +x "$SCRIPT_DIR/rclone"

# 4. Cleanup
echo "🧹 Cleaning temporary files..."
rm -f "$WORKSPACE_DIR/rclone-current.zip"
rm -rf "$WORKSPACE_DIR/rclone-temp"

echo ""
echo "============================================================"
echo "✅ Local rclone successfully installed at:"
echo "   $SCRIPT_DIR/rclone"
echo "============================================================"
echo ""
echo "Next step: Run the interactive Google Drive configuration:"
echo "   ./scripts/rclone config"
echo ""
echo "Configuration parameters to choose:"
echo "   1. Type 'n' (New Remote)"
echo "   2. Name it: gdrive"
echo "   3. Storage type: Select 'drive' (Google Drive)"
echo "   4. Client ID / Client Secret: Leave blank (press Enter)"
echo "   5. Scope: Select '1' (Full access to all files)"
echo "   6. Root folder ID: Leave blank (press Enter)"
echo "   7. Service Account JSON: Leave blank (press Enter)"
echo "   8. Edit advanced config: Type 'n' (No)"
echo "   9. Use auto config: Type 'y' (Yes) → Authenticate in browser"
echo "============================================================"
