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
