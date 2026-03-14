#!/bin/bash

echo "🔧 Creating Automatic Startup Scripts..."
echo "====================================="

echo "1. Systemd Service for ComfyUI..."

# Create systemd service for ComfyUI
cat > /tmp/comfyui.service << 'EOF'
[Unit]
Description=ComfyUI AI Service
After=network.target

[Service]
Type=simple
User=nikhil
WorkingDirectory=/home/nikhil/Documents/Remo2/ComfyUI
Environment=PATH=/home/nikhil/Documents/Remo2/ComfyUI/venv/bin
ExecStart=/home/nikhil/Documents/Remo2/ComfyUI/venv/bin/python main.py --listen 127.0.0.1 --port 8188 --highvram --enable-xformers
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

echo "   📄 ComfyUI service file created"

echo ""
echo "2. Startup Scripts for Different Scenarios..."

# Development startup script
cat > /home/nikhil/Documents/Remo2/Removation_3/start_dev.sh << 'EOF'
#!/bin/bash

echo "🛠️ Starting Development Environment..."
echo "===================================="

# Check if ComfyUI is running
if ! curl -s http://127.0.0.1:8188/system_stats > /dev/null; then
    echo "🎯 Starting ComfyUI..."
    cd /home/nikhil/Documents/Remo2/ComfyUI
    source venv/bin/activate
    python main.py --listen 127.0.0.1 --port 8188 &
    COMFYUI_PID=$!
    echo "ComfyUI PID: $COMFYUI_PID"
    
    # Wait for ComfyUI to be ready
    echo "⏳ Waiting for ComfyUI..."
    for i in {1..15}; do
        if curl -s http://127.0.0.1:8188/system_stats > /dev/null; then
            echo "✅ ComfyUI is ready!"
            break
        fi
        sleep 2
    done
else
    echo "✅ ComfyUI is already running"
fi

# Start Next.js development server
echo "🌐 Starting Next.js development server..."
cd /home/nikhil/Documents/Remo2/Removation_3
npm run dev

echo ""
echo "🎯 Development Environment Ready!"
echo "   ComfyUI: http://127.0.0.1:8188"
echo "   Next.js: http://localhost:3000"
EOF

chmod +x /home/nikhil/Documents/Remo2/Removation_3/start_dev.sh

# Production startup script
cat > /home/nikhil/Documents/Remo2/Removation_3/start_prod.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting Production Environment..."
echo "==================================="

# Check GPU availability
if ! nvidia-smi > /dev/null 2>&1; then
    echo "❌ NVIDIA GPU not available. Cannot start production."
    exit 1
fi

echo "🎯 GPU Status:"
nvidia-smi --query-gpu=name,memory.used,memory.total --format=csv,noheader

# Start ComfyUI with production settings
if ! curl -s http://127.0.0.1:8188/system_stats > /dev/null; then
    echo "🎯 Starting ComfyUI (production mode)..."
    cd /home/nikhil/Documents/Remo2/ComfyUI
    source venv/bin/activate
    nohup python main.py --listen 127.0.0.1 --port 8188 --highvram --enable-xformers --gpu-only > /var/log/comfyui.log 2>&1 &
    echo $! > /var/run/comfyui.pid
    echo "ComfyUI started with PID: $(cat /var/run/comfyui.pid)"
    
    # Wait for ComfyUI to be ready
    echo "⏳ Waiting for ComfyUI..."
    for i in {1..30}; do
        if curl -s http://127.0.0.1:8188/system_stats > /dev/null; then
            echo "✅ ComfyUI is ready!"
            break
        fi
        sleep 2
    done
else
    echo "✅ ComfyUI is already running"
fi

# Start Next.js production server
echo "🌐 Starting Next.js production server..."
cd /home/nikhil/Documents/Remo2/Removation_3
npm run build
npm start > /var/log/removation.log 2>&1 &
echo $! > /var/run/removation.pid

echo ""
echo "✅ Production Environment Started!"
echo "   ComfyUI: http://127.0.0.1:8188"
echo "   Next.js: http://localhost:3000"
echo "   Health: http://localhost:3000/api/health/comfyui"
echo ""
echo "📊 Logs:"
echo "   ComfyUI: tail -f /var/log/comfyui.log"
echo "   Removation: tail -f /var/log/removation.log"
EOF

chmod +x /home/nikhil/Documents/Remo2/Removation_3/start_prod.sh

# Quick test script
cat > /home/nikhil/Documents/Remo2/Removation_3/test_system.sh << 'EOF'
#!/bin/bash

echo "🧪 System Health Test"
echo "==================="

echo "1. GPU Status:"
nvidia-smi --query-gpu=name,memory.used,memory.total,utilization.gpu,temperature.gpu --format=csv,noheader,nounits

echo ""
echo "2. ComfyUI Status:"
if curl -s http://127.0.0.1:8188/system_stats > /dev/null; then
    echo "✅ ComfyUI is running"
    curl -s http://127.0.0.1:8188/system_stats | jq '.devices[0] | {name, vram_free, vram_total}'
else
    echo "❌ ComfyUI is not running"
fi

echo ""
echo "3. Next.js Status:"
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Next.js is running"
else
    echo "❌ Next.js is not running"
fi

echo ""
echo "4. Health Check:"
if curl -s http://localhost:3000/api/health/comfyui > /dev/null; then
    echo "✅ Health check API working"
    curl -s http://localhost:3000/api/health/comfyui | jq '.status, .gpu.vram_usage_percent, .comfyui.queue_size'
else
    echo "❌ Health check API not responding"
fi

echo ""
echo "5. Model Files:"
echo "   SDXL: $(ls -lh /home/nikhil/Documents/Remo2/ComfyUI/models/checkpoints/*.safetensors 2>/dev/null | wc -l) files"
echo "   ControlNet: $(ls -lh /home/nikhil/Documents/Remo2/ComfyUI/models/controlnet/*.safetensors 2>/dev/null | wc -l) files"
echo "   LoRAs: $(ls -lh /home/nikhil/Documents/Remo2/ComfyUI/models/loras/*.safetensors 2>/dev/null | wc -l) files"

echo ""
echo "🎯 System Test Complete!"
EOF

chmod +x /home/nikhil/Documents/Remo2/Removation_3/test_system.sh

# Stop script
cat > /home/nikhil/Documents/Remo2/Removation_3/stop_all.sh << 'EOF'
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
EOF

chmod +x /home/nikhil/Documents/Remo2/Removation_3/stop_all.sh

echo ""
echo "3. Desktop Shortcut (Optional)..."

# Create desktop shortcut
cat > /home/nikhil/Desktop/Removation-Dev.desktop << 'EOF'
[Desktop Entry]
Version=1.0
Type=Application
Name=Removation AI Development
Comment=Start Removation AI development environment
Exec=/home/nikhil/Documents/Remo2/Removation_3/start_dev.sh
Icon=applications-development
Terminal=true
Categories=Development;
EOF

chmod +x /home/nikhil/Desktop/Removation-Dev.desktop

echo ""
echo "🎯 Startup Scripts Created!"
echo ""
echo "📜 Available Scripts:"
echo "   🛠️  Development: ./start_dev.sh"
echo "   🚀 Production:  ./start_prod.sh"
echo "   🧪 System Test: ./test_system.sh"
echo "   🛑 Stop All:    ./stop_all.sh"
echo ""
echo "🖥️ Desktop Shortcut:"
echo "   Double-click 'Removation AI Development' on desktop"
echo ""
echo "⚙️ Systemd Service (Manual Install):"
echo "   sudo cp /tmp/comfyui.service /etc/systemd/system/"
echo "   sudo systemctl enable comfyui"
echo "   sudo systemctl start comfyui"
echo ""
echo "📊 Quick Commands:"
echo "   Test system: ./test_system.sh"
echo "   Check health: curl http://localhost:3000/api/health/comfyui"
echo "   Monitor GPU: ./monitor_gpu.sh"
