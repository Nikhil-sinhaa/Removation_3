#!/bin/bash

echo "🛑 Stopping All Services..."
echo "=========================="

# Stop ComfyUI
if [ -f /var/run/comfyui.pid ]; then
    PID=$(cat /var/run/comfyui.pid)
    if kill -0 "$PID" 2>/dev/null; then
        echo "🛑 Stopping ComfyUI (PID: $PID)..."
        kill "$PID"
        rm -f /var/run/comfyui.pid
        echo "✅ ComfyUI stopped"
    else
        echo "⚠️ ComfyUI process not found"
        rm -f /var/run/comfyui.pid
    fi
else
    echo "ℹ️ ComfyUI PID file not found"
fi

# Stop Next.js
if [ -f /var/run/removation.pid ]; then
    PID=$(cat /var/run/removation.pid)
    if kill -0 "$PID" 2>/dev/null; then
        echo "🛑 Stopping Next.js (PID: $PID)..."
        kill "$PID"
        rm -f /var/run/removation.pid
        echo "✅ Next.js stopped"
    else
        echo "⚠️ Next.js process not found"
        rm -f /var/run/removation.pid
    fi
else
    echo "ℹ️ Next.js PID file not found"
fi

# Kill any remaining processes
echo "🧹 Cleaning up remaining processes..."
pkill -f "python main.py" 2>/dev/null
pkill -f "next dev" 2>/dev/null
pkill -f "next start" 2>/dev/null

echo "✅ All services stopped"
