#!/bin/bash

# Removation.ai Development Server Launcher
# Starts ComfyUI and Next.js frontend simultaneously

echo "🚀 Starting Removation.ai Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}Port $1 is already in use${NC}"
        return 0
    else
        return 1
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local port=$1
    local name=$2
    local max_attempts=90
    local attempt=1
    
    echo -e "${BLUE}Waiting for $name to be ready...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:$port >/dev/null 2>&1; then
            echo -e "${GREEN}✅ $name is ready on port $port${NC}"
            return 0
        fi
        echo -e "${YELLOW}Attempt $attempt/$max_attempts: $name not ready yet...${NC}"
        sleep 2
        ((attempt++))
    done
    
    echo -e "${RED}❌ $name failed to start within $max_attempts attempts${NC}"
    return 1
}

# Kill existing processes
echo -e "${BLUE}🧹 Cleaning up existing processes...${NC}"
pkill -f "python3.*main.py" 2>/dev/null || true
pkill -f "next.*dev" 2>/dev/null || true
pkill -f "node.*3000" 2>/dev/null || true
sleep 2

# Check ports
if check_port 8188; then
    echo -e "${RED}❌ ComfyUI port 8188 is busy. Please stop the existing process.${NC}"
    exit 1
fi

if check_port 3000; then
    echo -e "${RED}❌ Next.js port 3000 is busy. Please stop the existing process.${NC}"
    exit 1
fi

# Create log directories
mkdir -p /tmp/logs
mkdir -p /home/nikhil/Documents/Remo2/ComfyUI/input
mkdir -p /home/nikhil/Documents/Remo2/ComfyUI/output

# Start ComfyUI
echo -e "${BLUE}🤖 Starting ComfyUI...${NC}"
cd /home/nikhil/Documents/Remo2/ComfyUI
source venv/bin/activate

# Detect if NVIDIA driver is loaded and working
USE_CPU=""
if ! nvidia-smi >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  NVIDIA driver is not responding or not loaded.${NC}"
    echo -e "${YELLOW}   Current kernel ($(uname -r)) is missing NVIDIA modules, which are installed on 6.17.0-22-generic.${NC}"
    echo -e "${YELLOW}   Falling back to CPU mode (--cpu) so the server can start. Note: Image generation will be slow.${NC}"
    echo -e "${YELLOW}   👉 Tip: Reboot and select kernel '6.17.0-22-generic' from the GRUB advanced boot options to restore full GPU acceleration.${NC}"
    USE_CPU="--cpu"
fi

# ComfyUI optimized for RTX 4060 8GB (or fallback to CPU)
export XFORMERS_FORCE_DISABLE_TRITON=1
export TORCH_CUDNN_V8_API_ENABLED=1

if [ -n "$USE_CPU" ]; then
    python3 main.py \
        --listen 0.0.0.0 \
        --port 8188 \
        --cpu \
        --disable-metadata \
        --enable-manager \
        > /tmp/logs/comfyui.log 2>&1 &
else
    python3 main.py \
        --listen 0.0.0.0 \
        --port 8188 \
        --lowvram \
        --preview-method auto \
        --disable-metadata \
        --disable-xformers \
        --enable-manager \
        > /tmp/logs/comfyui.log 2>&1 &
fi

COMFYUI_PID=$!
echo "ComfyUI PID: $COMFYUI_PID"

# Wait for ComfyUI to be ready
if ! wait_for_service 8188 "ComfyUI"; then
    echo -e "${RED}❌ ComfyUI failed to start. Check logs: /tmp/logs/comfyui.log${NC}"
    kill $COMFYUI_PID 2>/dev/null
    exit 1
fi

# Start Next.js Frontend
echo -e "${BLUE}🌐 Starting Next.js Frontend...${NC}"
cd /home/nikhil/Documents/Remo2/Removation_3

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

# Start Next.js in background
npm run dev > /tmp/logs/nextjs.log 2>&1 &
NEXTJS_PID=$!
echo "Next.js PID: $NEXTJS_PID"

# Wait for Next.js to be ready
if ! wait_for_service 3000 "Next.js"; then
    echo -e "${RED}❌ Next.js failed to start. Check logs: /tmp/logs/nextjs.log${NC}"
    kill $COMFYUI_PID 2>/dev/null
    kill $NEXTJS_PID 2>/dev/null
    exit 1
fi

# Create trap for cleanup
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down services...${NC}"
    kill $COMFYUI_PID 2>/dev/null
    kill $NEXTJS_PID 2>/dev/null
    echo -e "${GREEN}✅ All services stopped${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Display status
echo -e "${GREEN}🎉 Removation.ai Development Environment is running!${NC}"
echo -e "${BLUE}┌─────────────────────────────────────────────────────────┐${NC}"
echo -e "${BLUE}│${NC}  ${GREEN}ComfyUI:${NC}       http://localhost:8188${NC}         ${BLUE}│${NC}"
echo -e "${BLUE}│${NC}  ${GREEN}Next.js:${NC}        http://localhost:3000${NC}         ${BLUE}│${NC}"
echo -e "${BLUE}│${NC}  ${GREEN}Logs:${NC}           /tmp/logs/${NC}                ${BLUE}│${NC}"
echo -e "${BLUE}└─────────────────────────────────────────────────────────┘${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

# Monitor services
while true; do
    # Check if ComfyUI is responding
    if ! curl -s http://localhost:8188/system_stats >/dev/null 2>&1; then
        echo -e "${RED}❌ ComfyUI not responding${NC}"
        break
    fi
    
    # Check if Next.js is responding
    if ! curl -s http://localhost:3000 >/dev/null 2>&1; then
        echo -e "${RED}❌ Next.js not responding${NC}"
        break
    fi
    
    sleep 10
done

# If we reach here, something went wrong
cleanup
