#!/bin/bash
# Start both ComfyUI and Next.js for Removation
# Includes memory pre-flight checks to prevent OOM crashes.

echo "======================================"
echo "🏠 REMOVATION.AI — DEV STARTUP"
echo "======================================"
echo ""

# ── Memory pre-flight ─────────────────────────────────────────────────────────
FREE_MB=$(awk '/MemAvailable/ {printf "%d", $2/1024}' /proc/meminfo)
TOTAL_MB=$(awk '/MemTotal/ {printf "%d", $2/1024}' /proc/meminfo)
USED_PCT=$(( (TOTAL_MB - FREE_MB) * 100 / TOTAL_MB ))
SWAP_TOTAL=$(awk '/SwapTotal/ {printf "%d", $2/1024}' /proc/meminfo)
SWAP_FREE=$(awk '/SwapFree/ {printf "%d", $2/1024}' /proc/meminfo)
SWAP_USED=$(( SWAP_TOTAL - SWAP_FREE ))

echo "🧠 RAM:  ${FREE_MB}MB free / ${TOTAL_MB}MB total (${USED_PCT}% used)"
echo "💾 Swap: ${SWAP_USED}MB used / ${SWAP_TOTAL}MB total"
echo ""

if [ "$FREE_MB" -lt 2000 ]; then
  echo "❌ Less than 2GB free. Free up memory before starting."
  echo "   • Close Chrome tabs"
  echo "   • Restart ComfyUI: python main.py --lowvram --fp8_e4m3fn-unet"
  echo "   • Kill unused processes: htop"
  exit 1
fi

# Kill duplicate MCP servers before starting
pkill -f mongodb-mcp-server 2>/dev/null && echo "✅ Killed duplicate MCP servers" || true

# Warn if ComfyUI is using --highvram
if ps aux 2>/dev/null | grep -q -- "--highvram" 2>/dev/null; then
  echo "⚠️  WARNING: ComfyUI is running with --highvram. Restart with --lowvram to save RAM."
fi

# Clear bloated .next cache
if [ -d "/home/nikhil/Documents/Remo2/Removation_3/.next" ]; then
  NEXT_SIZE=$(du -sm /home/nikhil/Documents/Remo2/Removation_3/.next 2>/dev/null | cut -f1 || echo "0")
  if [ "${NEXT_SIZE:-0}" -gt 3000 ]; then
    echo "🗑️  Clearing .next cache (${NEXT_SIZE}MB)..."
    rm -rf /home/nikhil/Documents/Remo2/Removation_3/.next
  fi
fi

echo "🛡️  Memory watchdog will activate when Next.js starts (kills at 90% RAM)"
echo ""


# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1
}

# Check if ComfyUI is already running
if check_port 8188; then
    echo -e "${GREEN}✓ ComfyUI already running on port 8188${NC}"
else
    echo -e "${YELLOW}→ Starting ComfyUI...${NC}"
    cd /home/nikhil/Documents/Remo2/ComfyUI || exit 1
    
    # Check if venv exists
    if [ -f "venv/bin/activate" ]; then
        source venv/bin/activate
    fi
    
    # Start ComfyUI in background
    python main.py --listen 127.0.0.1 --port 8188 --enable-manager &
    COMFY_PID=$!
    
    # Wait for ComfyUI to start
    echo "⏳ Waiting for ComfyUI to start..."
    for i in {1..30}; do
        if check_port 8188; then
            echo -e "${GREEN}✓ ComfyUI started!${NC}"
            break
        fi
        sleep 1
    done
    
    if ! check_port 8188; then
        echo -e "${RED}✗ ComfyUI failed to start${NC}"
        exit 1
    fi
fi

echo ""

# Check if Next.js is already running
if check_port 3000; then
    echo -e "${GREEN}✓ Next.js already running on port 3000${NC}"
else
    echo -e "${YELLOW}→ Starting Next.js...${NC}"
    cd /home/nikhil/Documents/Remo2/Removation_3 || exit 1
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo "⏳ Installing dependencies..."
        npm install
    fi
    
    # Start Next.js
    npm run dev &
    NEXT_PID=$!
    
    # Wait for Next.js to start
    echo "⏳ Waiting for Next.js to start..."
    for i in {1..30}; do
        if check_port 3000; then
            echo -e "${GREEN}✓ Next.js started!${NC}"
            break
        fi
        sleep 1
    done
    
    if ! check_port 3000; then
        echo -e "${RED}✗ Next.js failed to start${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 Removation is running!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "📱 App URL:     http://localhost:3000"
echo "🎨 Demo Page:   http://localhost:3000/demo"
echo "🤖 ComfyUI:     http://127.0.0.1:8188"
echo "💚 Health:      http://localhost:3000/api/health/comfyui"
echo ""
echo "Press Ctrl+C to stop both services"
echo ""

# Keep script running
wait
