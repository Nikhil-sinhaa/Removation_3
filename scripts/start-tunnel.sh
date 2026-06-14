#!/bin/bash
# Starts Cloudflare Tunnel exposing local ComfyUI to the internet.
# Run this on your laptop before any AI generation on Vercel.
# Usage: bash scripts/start-tunnel.sh

echo "Starting Cloudflare Tunnel for ComfyUI..."
echo "ComfyUI must be running on port 8188 first."
echo ""

# Check if ComfyUI is running
if ! curl -s http://127.0.0.1:8188/system_stats > /dev/null 2>&1; then
  echo "⚠️  Warning: ComfyUI doesn't seem to be running on port 8188"
  echo "   Start it first, then run this script again."
  echo ""
fi

# Check if cloudflared is installed
if ! command -v cloudflared &>/dev/null; then
  echo "cloudflared not found. Installing..."
  wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
  sudo dpkg -i cloudflared-linux-amd64.deb
  rm cloudflared-linux-amd64.deb
fi

echo "Tunnel starting — copy the https URL and set it as:"
echo "  COLAB_COMFY_URL in Vercel env vars"
echo "  or update via Admin → GPU Settings"
echo ""
cloudflared tunnel --url http://127.0.0.1:8188
