#!/bin/bash

echo "🛡️ Setting Up Production Monitoring & Error Handling..."
echo "=================================================="

echo "1. Creating Health Check API..."

# Create a health check endpoint for ComfyUI
cat > /home/nikhil/Documents/Remo2/Removation_3/app/api/health/comfyui/route.ts << 'EOF'
import { NextRequest, NextResponse } from "next/server";
import { comfyUIMonitor } from "@/lib/ai/comfyui-monitoring";

export async function GET(req: NextRequest) {
  try {
    const health = await comfyUIMonitor.checkSystemHealth();
    
    return NextResponse.json({
      status: health.status,
      timestamp: new Date().toISOString(),
      gpu: {
        name: health.gpu.name,
        vram_usage_percent: ((health.gpu.vram_used / health.gpu.vram_total) * 100).toFixed(1),
        temperature: health.gpu.temperature,
        utilization: health.gpu.utilization
      },
      comfyui: {
        running: health.comfyui.running,
        queue_size: health.comfyui.queue_size,
        active_generations: health.comfyui.active_generations
      },
      errors: health.errors
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'critical',
        error: 'Health check failed',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
EOF

echo "   ✅ Health check API created at /api/health/comfyui"

echo ""
echo "2. Setting Up Error Logging..."

# Create error logging middleware
cat > /home/nikhil/Documents/Remo2/Removation_3/lib/ai/comfyui-errors.ts << 'EOF'
import fs from 'fs';
import path from 'path';

export interface ErrorLog {
  timestamp: string;
  severity: 'error' | 'warning' | 'info';
  component: 'comfyui' | 'gpu' | 'api' | 'workflow';
  message: string;
  details?: any;
  userId?: string;
  renderId?: string;
}

export class ComfyUIErrorLogger {
  private logFile: string;
  private maxLogSize: number = 10 * 1024 * 1024; // 10MB

  constructor() {
    this.logFile = path.join(process.cwd(), 'logs', 'comfyui-errors.log');
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  private rotateLogIfNeeded(): void {
    try {
      if (fs.existsSync(this.logFile) && fs.statSync(this.logFile).size > this.maxLogSize) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const archiveFile = this.logFile.replace('.log', `-${timestamp}.log`);
        fs.renameSync(this.logFile, archiveFile);
      }
    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }
  }

  log(entry: Omit<ErrorLog, 'timestamp'>): void {
    this.rotateLogIfNeeded();

    const logEntry: ErrorLog = {
      timestamp: new Date().toISOString(),
      ...entry
    };

    const logLine = JSON.stringify(logEntry) + '\n';

    try {
      fs.appendFileSync(this.logFile, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }

    // Also log to console for immediate visibility
    const emoji = {
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    }[entry.severity];

    console.log(`${emoji} [${entry.component.toUpperCase()}] ${entry.message}`);
  }

  logComfyUIError(message: string, details?: any, renderId?: string): void {
    this.log({
      severity: 'error',
      component: 'comfyui',
      message,
      details,
      renderId
    });
  }

  logGPUError(message: string, details?: any): void {
    log({
      severity: 'error',
      component: 'gpu',
      message,
      details
    });
  }

  logAPIError(message: string, userId?: string, details?: any): void {
    this.log({
      severity: 'error',
      component: 'api',
      message,
      userId,
      details
    });
  }

  logWorkflowError(message: string, renderId?: string, details?: any): void {
    this.log({
      severity: 'error',
      component: 'workflow',
      message,
      renderId,
      details
    });
  }

  getRecentErrors(limit: number = 50): ErrorLog[] {
    try {
      if (!fs.existsSync(this.logFile)) {
        return [];
      }

      const content = fs.readFileSync(this.logFile, 'utf8');
      const lines = content.trim().split('\n').filter(line => line.trim());
      
      return lines
        .slice(-limit)
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .filter(Boolean);
    } catch (error) {
      console.error('Failed to read log file:', error);
      return [];
    }
  }
}

export const comfyUIErrorLogger = new ComfyUIErrorLogger();
EOF

echo "   ✅ Error logging system created"

echo ""
echo "3. Creating Monitoring Dashboard..."

# Create a simple monitoring dashboard
cat > /home/nikhil/Documents/Remo2/Removation_3/app/api/monitoring/dashboard/route.ts << 'EOF'
import { NextRequest, NextResponse } from "next/server";
import { comfyUIMonitor } from "@/lib/ai/comfyui-monitoring";
import { comfyUIErrorLogger } from "@/lib/ai/comfyui-errors";

export async function GET(req: NextRequest) {
  try {
    const health = await comfyUIMonitor.checkSystemHealth();
    const recentErrors = comfyUIErrorLogger.getRecentErrors(20);

    return NextResponse.json({
      health,
      recentErrors,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      summary: {
        status: health.status,
        gpu_utilization: health.gpu.utilization,
        vram_usage_percent: ((health.gpu.vram_used / health.gpu.vram_total) * 100).toFixed(1),
        queue_size: health.comfyui.queue_size,
        error_count: recentErrors.filter(e => e.severity === 'error').length,
        warning_count: recentErrors.filter(e => e.severity === 'warning').length
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Dashboard data failed',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
EOF

echo "   ✅ Monitoring dashboard API created"

echo ""
echo "4. Setting Up Automated Health Checks..."

# Create cron job for health checks
cat > /home/nikhil/Documents/Remo2/Removation_3/scripts/health-check.sh << 'EOF'
#!/bin/bash

# Automated health check script
# Run this every minute via cron

LOG_FILE="/home/nikhil/Documents/Remo2/Removation_3/logs/health-checks.log"
mkdir -p "$(dirname "$LOG_FILE")"

# Check ComfyUI health
HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/health/comfyui)
TIMESTAMP=$(date -Iseconds)

echo "[$TIMESTAMP] Health check response:" >> "$LOG_FILE"
echo "$HEALTH_RESPONSE" | jq '.' >> "$LOG_FILE"

# Extract status
STATUS=$(echo "$HEALTH_RESPONSE" | jq -r '.status // "unknown"')

if [ "$STATUS" = "critical" ]; then
    echo "[$TIMESTAMP] 🚨 CRITICAL: ComfyUI system unhealthy!" >> "$LOG_FILE"
    
    # Send alert (you can integrate with email, Slack, etc.)
    echo "ComfyUI system is in CRITICAL state. Check immediately."
    
    # Try to restart ComfyUI if it's down
    if ! curl -s http://127.0.0.1:8188/system_stats > /dev/null; then
        echo "[$TIMESTAMP] 🔄 Attempting to restart ComfyUI..." >> "$LOG_FILE"
        cd /home/nikhil/Documents/Remo2/ComfyUI
        source venv/bin/activate
        nohup python main.py --listen 127.0.0.1 --port 8188 > /dev/null 2>&1 &
        echo "[$TIMESTAMP] ✅ ComfyUI restart initiated" >> "$LOG_FILE"
    fi
elif [ "$STATUS" = "degraded" ]; then
    echo "[$TIMESTAMP] ⚠️ DEGRADED: System performance issues" >> "$LOG_FILE"
else
    echo "[$TIMESTAMP] ✅ HEALTHY: System operating normally" >> "$LOG_FILE"
fi

echo "---" >> "$LOG_FILE"
EOF

chmod +x /home/nikhil/Documents/Remo2/Removation_3/scripts/health-check.sh

echo "   ✅ Automated health check script created"

echo ""
echo "5. Creating Production Startup Script..."

cat > /home/nikhil/Documents/Remo2/Removation_3/start_production.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting Removation.ai Production Environment..."
echo "================================================"

# Start ComfyUI in background
echo "🎯 Starting ComfyUI..."
cd /home/nikhil/Documents/Remo2/ComfyUI
source venv/bin/activate
nohup python main.py --listen 127.0.0.1 --port 8188 > /tmp/comfyui.log 2>&1 &
COMFYUI_PID=$!
echo "ComfyUI PID: $COMFYUI_PID"

# Wait for ComfyUI to be ready
echo "⏳ Waiting for ComfyUI to be ready..."
for i in {1..30}; do
    if curl -s http://127.0.0.1:8188/system_stats > /dev/null; then
        echo "✅ ComfyUI is ready!"
        break
    fi
    sleep 2
done

# Start Next.js
echo "🌐 Starting Next.js..."
cd /home/nikhil/Documents/Remo2/Removation_3
npm run dev > /tmp/nextjs.log 2>&1 &
NEXTJS_PID=$!
echo "Next.js PID: $NEXTJS_PID"

# Save PIDs for management
echo "$COMFYUI_PID" > /tmp/comfyui.pid
echo "$NEXTJS_PID" > /tmp/nextjs.pid

echo ""
echo "✅ Production environment started!"
echo "   ComfyUI: http://127.0.0.1:8188"
echo "   Next.js: http://localhost:3000"
echo "   Health: http://localhost:3000/api/health/comfyui"
echo "   Dashboard: http://localhost:3000/api/monitoring/dashboard"

echo ""
echo "📊 To monitor:"
echo "   ./monitor_gpu.sh"
echo "   tail -f /tmp/comfyui.log"
echo "   tail -f /tmp/nextjs.log"
EOF

chmod +x /home/nikhil/Documents/Remo2/Removation_3/start_production.sh

echo "   ✅ Production startup script created"

echo ""
echo "🎯 Production Monitoring Setup Complete!"
echo ""
echo "📊 Available Endpoints:"
echo "   Health Check: http://localhost:3000/api/health/comfyui"
echo "   Dashboard: http://localhost:3000/api/monitoring/dashboard"
echo ""
echo "🔧 Management Scripts:"
echo "   Start Production: ./start_production.sh"
echo "   Health Monitor: ./scripts/health-check.sh"
echo "   GPU Monitor: ./monitor_gpu.sh"
echo ""
echo "📝 Log Files:"
echo "   Errors: logs/comfyui-errors.log"
echo "   Health: logs/health-checks.log"
echo "   ComfyUI: /tmp/comfyui.log"
echo "   Next.js: /tmp/nextjs.log"
echo ""
echo "⚠️  Don't forget to set up cron for health checks:"
echo "   */1 * * * * /home/nikhil/Documents/Remo2/Removation_3/scripts/health-check.sh"
