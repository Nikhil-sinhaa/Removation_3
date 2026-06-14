#!/bin/bash
# =============================================================================
# Removation.ai — Google Drive Service Account Setup
# Run from your project root: bash scripts/setup-drive.sh
# =============================================================================

set -e  # exit on any error

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_LOCAL="$PROJECT_ROOT/.env.local"
DOWNLOADS="$HOME/Downloads"
SA_NAME="removation-drive"
DRIVE_FOLDER_NAME="removation-renders"
KEY_FILE="$DOWNLOADS/removation-drive-key.json"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   Removation.ai — Google Drive Setup Script         ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ── Step 0: Check dependencies ───────────────────────────────────────────────
echo "▶ Checking dependencies..."

if ! command -v gcloud &>/dev/null; then
  echo "❌ gcloud CLI not found. Install it first:"
  echo "   curl https://sdk.cloud.google.com | bash"
  echo "   exec -l \$SHELL"
  echo "   gcloud init"
  exit 1
fi

if ! command -v python3 &>/dev/null; then
  echo "❌ python3 not found. Install it: sudo apt install python3"
  exit 1
fi

echo "   ✅ gcloud found: $(gcloud --version | head -1)"
echo "   ✅ python3 found"

# ── Step 1: Get / confirm GCP project ────────────────────────────────────────
echo ""
echo "▶ Step 1: Detecting GCP project..."

CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)

if [ -z "$CURRENT_PROJECT" ] || [ "$CURRENT_PROJECT" = "(unset)" ]; then
  echo ""
  echo "   No active GCP project found. Listing your projects:"
  gcloud projects list
  echo ""
  read -p "   Enter your project ID from the list above: " CURRENT_PROJECT
  gcloud config set project "$CURRENT_PROJECT"
fi

echo "   ✅ Using project: $CURRENT_PROJECT"

# ── Step 2: Enable Google Drive API ──────────────────────────────────────────
echo ""
echo "▶ Step 2: Enabling Google Drive API..."
gcloud services enable drive.googleapis.com --project="$CURRENT_PROJECT" 2>&1 | grep -v "^$" || true
echo "   ✅ Google Drive API enabled"

# ── Step 3: Create service account ───────────────────────────────────────────
echo ""
echo "▶ Step 3: Creating service account '$SA_NAME'..."

# Check if it already exists
SA_EXISTS=$(gcloud iam service-accounts list \
  --filter="email:${SA_NAME}@${CURRENT_PROJECT}.iam.gserviceaccount.com" \
  --format="value(email)" 2>/dev/null)

if [ -n "$SA_EXISTS" ]; then
  echo "   ℹ️  Service account already exists: $SA_EXISTS"
  SA_EMAIL="$SA_EXISTS"
else
  gcloud iam service-accounts create "$SA_NAME" \
    --display-name="Removation Drive Storage" \
    --project="$CURRENT_PROJECT"
  SA_EMAIL="${SA_NAME}@${CURRENT_PROJECT}.iam.gserviceaccount.com"
  echo "   ✅ Created: $SA_EMAIL"
fi

# ── Step 4: Download JSON key ─────────────────────────────────────────────────
echo ""
echo "▶ Step 4: Downloading service account JSON key..."

if [ -f "$KEY_FILE" ]; then
  echo "   ℹ️  Key file already exists at $KEY_FILE — reusing it"
else
  gcloud iam service-accounts keys create "$KEY_FILE" \
    --iam-account="$SA_EMAIL" \
    --project="$CURRENT_PROJECT"
  echo "   ✅ Key saved to: $KEY_FILE"
fi

# Compact to single line
SA_JSON=$(python3 -c "import json; f=open('$KEY_FILE'); print(json.dumps(json.load(f)))")
echo "   ✅ JSON compacted to single line"

# ── Step 5: Create Google Drive folder ───────────────────────────────────────
echo ""
echo "▶ Step 5: Creating Google Drive folder '$DRIVE_FOLDER_NAME'..."
echo "   (This uses the service account — the folder will appear in its Drive, not yours)"
echo ""
echo "   ⚠️  MANUAL STEP REQUIRED:"
echo ""
echo "   1. Go to: https://drive.google.com"
echo "   2. Click New → Folder → name it: $DRIVE_FOLDER_NAME"
echo "   3. Right-click the folder → Share"
echo "   4. Paste this email and give Editor access:"
echo ""
echo "      👉  $SA_EMAIL"
echo ""
echo "   5. Open the folder and copy the ID from the URL:"
echo "      https://drive.google.com/drive/folders/THIS_IS_THE_ID"
echo ""
read -p "   Paste your Drive folder ID here: " FOLDER_ID

if [ -z "$FOLDER_ID" ]; then
  echo "   ⚠️  No folder ID entered — you can add GOOGLE_DRIVE_RENDERS_FOLDER_ID manually later"
  FOLDER_ID=""
fi

# ── Step 6: Write to .env.local ──────────────────────────────────────────────
echo ""
echo "▶ Step 6: Writing to .env.local..."

# Remove old values if they exist
sed -i '/^STORAGE_MODE=/d' "$ENV_LOCAL" 2>/dev/null || true
sed -i '/^GOOGLE_SERVICE_ACCOUNT_JSON=/d' "$ENV_LOCAL" 2>/dev/null || true
sed -i '/^GOOGLE_DRIVE_RENDERS_FOLDER_ID=/d' "$ENV_LOCAL" 2>/dev/null || true
sed -i '/^GOOGLE_DRIVE_PREVIEWS_FOLDER_ID=/d' "$ENV_LOCAL" 2>/dev/null || true

# Append new values
echo "" >> "$ENV_LOCAL"
echo "# Google Drive Storage (added by setup-drive.sh)" >> "$ENV_LOCAL"
echo "STORAGE_MODE=local" >> "$ENV_LOCAL"
echo "GOOGLE_SERVICE_ACCOUNT_JSON=$SA_JSON" >> "$ENV_LOCAL"
echo "GOOGLE_DRIVE_RENDERS_FOLDER_ID=$FOLDER_ID" >> "$ENV_LOCAL"
echo "GOOGLE_DRIVE_PREVIEWS_FOLDER_ID=$FOLDER_ID" >> "$ENV_LOCAL"

echo "   ✅ Written to $ENV_LOCAL"

# ── Step 7: Run test upload ───────────────────────────────────────────────────
echo ""
echo "▶ Step 7: Running test upload to Google Drive..."
echo ""

cd "$PROJECT_ROOT"
node --env-file=.env.local test_drive_upload.js

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   ✅ Setup complete!                                 ║"
echo "║                                                      ║"
echo "║   STORAGE_MODE=local  (safe default)                ║"
echo "║   Switch to 'drive' via admin panel when ready      ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "  1. Open the image URL above in your browser — it should show a green pixel"
echo "  2. If it works, go to /admin/settings and toggle Storage Mode → Drive"
echo "  3. Generate a real image and confirm it appears in your Drive folder"
echo ""
