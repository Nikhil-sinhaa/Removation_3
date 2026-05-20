# Removation.ai Development Launcher

## Quick Start

```bash
# Run the development script
./start-dev.sh
```

## What it does

1. **Cleanup**: Kills existing ComfyUI and Next.js processes
2. **Port Check**: Ensures ports 8188 and 3000 are available
3. **ComfyUI**: Starts with RTX 4060 optimization:
   - GPU-only mode
   - Channel-last optimization
   - Auto preview method
   - Metadata disabled for performance
4. **Next.js**: Starts the frontend development server
5. **Monitoring**: Waits for both services to be ready
6. **Logs**: Creates organized logs in `/tmp/logs/`

## Services

- **ComfyUI**: http://localhost: 8188
- **Next.js**: http://localhost:3000
- **Logs**: `/tmp/logs/comfyui.log` and `/tmp/logs/nextjs.log`

## Stop Services

Press `Ctrl+C` to stop both services gracefully.

## Manual Control

If you need to run services separately:

```bash
# ComfyUI only
cd /home/nikhil/Documents/Remo2/ComfyUI
source venv/bin/activate
python3 main.py --listen 0.0.0.0 --port 8188 --gpu-only --force-channels-last --preview-method auto --disable-metadata

# Next.js only
cd /home/nikhil/Documents/Remo2/Removation_3
npm run dev
```
