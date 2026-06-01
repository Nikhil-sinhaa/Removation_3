#!/usr/bin/env bash
set -euo pipefail

echo "=== Redis Setup for Removation.ai ==="

# Install if missing
if ! command -v redis-server &> /dev/null; then
  echo "Installing Redis..."
  sudo apt-get update && sudo apt-get install -y redis-server
else
  echo "Redis already installed: $(redis-server --version)"
fi

REDIS_CONF="/etc/redis/redis.conf"

if [ ! -f "$REDIS_CONF" ]; then
  echo "redis.conf not found at $REDIS_CONF — skipping config tuning"
else
  # Cap memory at 256MB — volatile-lru eviction (Point 4: volatile data first)
  sudo sed -i 's/^# maxmemory .*/maxmemory 256mb/'         "$REDIS_CONF"
  sudo sed -i 's/^maxmemory .*/maxmemory 256mb/'            "$REDIS_CONF"
  sudo sed -i 's/^# maxmemory-policy .*/maxmemory-policy volatile-lru/' "$REDIS_CONF"
  sudo sed -i 's/^maxmemory-policy .*/maxmemory-policy volatile-lru/'   "$REDIS_CONF"

  # Disable disk persistence for dev (speeds up dev, locks and sessions are ephemeral)
  sudo sed -i 's/^save 900/#save 900/' "$REDIS_CONF"
  sudo sed -i 's/^save 300/#save 300/' "$REDIS_CONF"
  sudo sed -i 's/^save 60/#save 60/'   "$REDIS_CONF"

  # Bind to localhost only — security hardening (Point 5)
  sudo sed -i 's/^bind .*/bind 127.0.0.1/' "$REDIS_CONF"

  echo "Redis config updated"
fi

sudo systemctl restart redis-server
sudo systemctl enable redis-server

echo ""
echo "✅ Redis running:"
redis-cli ping

echo ""
echo "Next: add these to .env.local"
echo "  REDIS_HOST=127.0.0.1"
echo "  REDIS_PORT=6379"
echo "  REDIS_PASSWORD="
echo "  REDIS_TLS=false"
