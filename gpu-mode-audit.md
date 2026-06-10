# GPU Mode Switching System Audit Report

Based on a thorough review of the provided files, here is an honest assessment of the system's current state, identifying exactly what the code says is working, broken, and missing.

## 1. Core GPU Routing (`lib/ai/gpu-mode-router.ts`, `lib/ai/cloud-comfy-adapter.ts`, `src/lib/appSettings.ts`)
**What is working:**
- The router correctly defines a 3-tier system (`local`, `cloud`, `auto`).
- In `auto` mode, the router actively tests the cloud connection using a 3-second timeout (`pingComfyUI`) before deciding whether to route traffic to the cloud or fall back to local hardware.
- The `cloud-comfy-adapter.ts` correctly exposes HTTP endpoints for file manipulation (`/upload/image`, `/view`) intended for a remote ComfyUI instance.
- MongoDB schema and helper functions (`appSettings.ts`) exist to persist application configuration.

**What is broken:**
- State volatility: The router relies entirely on `globalThis.__GPU_MODE__` and module-scoped variables (`currentMode`) to store runtime state. In a serverless or multi-process environment (like Vercel), this state resets on cold starts and does not synchronize across concurrent instances.
- Initialization failure: On boot, `gpu-mode-router.ts` initializes strictly from `process.env.COMFYUI_MODE`. It does not query MongoDB (`AppSettings`) at startup. Any saved database settings are ignored after a server restart until an explicit update is triggered.
- Silenced errors: The `pingComfyUI` health check silently swallows all network errors (timeouts, DNS failures, 500s) and returns `false`, obfuscating the root cause of connection failures.

**What is missing:**
- Initialization logic to synchronize the router's memory state with MongoDB when the application boots.
- A robust, persistent state mechanism capable of spanning multiple processes/functions.

## 2. ComfyUI Bridge and Pipeline (`comfyui-bridge.ts`, `comfyBridge.js`, `pipeline-orchestrator.ts`)
**What is working:**
- `pipeline-orchestrator.ts` chains multiple ComfyUI jobs sequentially and explicitly attempts to manage the 8GB local VRAM limit by issuing a `POST /free` command between stages.
- `comfyBridge.js` implements a queueing system (`_ultraProRunning` guard) to prevent concurrent execution conflicts that would crash the GPU.
- `comfyui-bridge.ts` integrates `getActiveComfyBaseUrl()` for HTTP requests, meaning it attempts to respect the router's current state.

**What is broken:**
- VRAM flushing assumptions: The `POST /free` command is sent indiscriminately. If the cloud target (e.g., T4 on Colab) does not have the custom memory management endpoint installed, the pipeline stages will throw unhandled errors or warnings.
- Cloud image saving: `save-image-for-comfy.ts` relies on `uploadImageToCloud()` in cloud mode, but the pipeline heavily depends on reading from/writing to local directories (`COMFY_INPUT`, `COMFY_OUTPUT`), creating a disconnect between the orchestrator's file expectations and the cloud adapter's execution.

**What is missing:**
- Reconnection resilience: The WebSocket connection in `comfyBridge.js` lacks robust error handling and reconnection logic if the Cloudflare tunnel drops mid-generation.

## 3. UI & Admin Controls (`app/(app)/settings/gpu/page.tsx`, `app/api/settings/gpu/route.ts`, `app/api/settings/gpu-mode/route.ts`)
**What is working:**
- The frontend UI successfully exposes manual controls for an administrator to switch between modes and view active configuration.
- `app/api/settings/gpu/route.ts` successfully updates both the runtime state (`setGPUModeRuntime`) and the persistent database (`setSetting`).

**What is broken:**
- Severe state fragmentation: `app/api/settings/gpu-mode/route.ts` calls `setGPUModeRuntime` to alter the system but **completely omits** saving the mode to MongoDB. Any changes made through this endpoint are ephemeral and will be lost.

**What is missing:**
- A unified single source of truth. Having two separate API routes that handle state changes differently leads to race conditions and desynchronization between the database and active memory.

## 4. Health Checks and Status (`app/api/ai/status/*`, `app/api/health/comfyui/route.ts`)
**What is working:**
- `app/api/health/comfyui/route.ts` and `app/api/ai/status/health/route.js` query `/system_stats` to return structured JSON payloads regarding VRAM usage, queue depth, and basic availability.
- `app/api/ai/status/health/route.js` successfully respects the router by using `getActiveComfyBaseUrl()`.

**What is broken:**
- **Critical hardcoding:** `app/api/ai/status/route.js` is entirely hardcoded to `http://127.0.0.1:8188/system_stats` and `http://127.0.0.1:8188/queue`. It completely ignores the GPU router and will always query the local machine, even if the system is securely locked into `cloud` mode.
- **Critical hardcoding:** `app/api/ai/status/[promptId]/route.js` is entirely hardcoded to `http://127.0.0.1:8188/queue` and `http://127.0.0.1:8188/history`. Job polling for image results will fail 100% of the time in cloud mode because it is searching the local queue instead of the cloud provider.

**What is missing:**
- Integration of `getActiveComfyBaseUrl()` across all monitoring and status API routes to ensure they dynamically follow the system's designated GPU.
