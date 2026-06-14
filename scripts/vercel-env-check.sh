#!/bin/bash
# Run locally to verify all required env vars are set before deploying to Vercel.
# Usage: bash scripts/vercel-env-check.sh

ENV_FILE=".env.local"
MISSING=0

check() {
  local key=$1
  local required=$2
  local val
  val=$(grep "^${key}=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2-)
  if [ -z "$val" ]; then
    if [ "$required" = "required" ]; then
      echo "❌ MISSING (required): $key"
      MISSING=$((MISSING + 1))
    else
      echo "⚠️  not set (optional): $key"
    fi
  else
    echo "✅ $key"
  fi
}

echo ""
echo "=== Removation.ai — Vercel Env Var Check ==="
echo ""
echo "── Core ──"
check "MONGODB_URI"          required
check "JWT_SECRET"           required
check "NEXT_PUBLIC_APP_URL"  required

echo ""
echo "── Storage ──"
check "STORAGE_MODE"                      required
check "GOOGLE_SERVICE_ACCOUNT_JSON"       required
check "GOOGLE_DRIVE_RENDERS_FOLDER_ID"    required

echo ""
echo "── GPU / ComfyUI ──"
check "COLAB_COMFY_URL"   required
check "GPU_MODE"          required

echo ""
echo "── Payments ──"
check "RAZORPAY_KEY_ID"     optional
check "RAZORPAY_KEY_SECRET" optional
check "STRIPE_SECRET_KEY"   optional

echo ""
echo "── Redis ──"
check "REDIS_URL"  required

echo ""
echo "── Optional ──"
check "UPLOADTHING_TOKEN"    optional
check "GOOGLE_CLIENT_ID"     optional
check "GOOGLE_CLIENT_SECRET" optional

echo ""
if [ $MISSING -gt 0 ]; then
  echo "❌ $MISSING required variable(s) missing. Fix before deploying."
  exit 1
else
  echo "✅ All required variables are set. Safe to deploy."
fi
echo ""
