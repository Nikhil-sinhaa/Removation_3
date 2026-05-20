/**
 * GPU Mode Router
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for which ComfyUI instance the app talks to.
 *
 * Modes:
 *   'local'  → your RTX 4060 machine (127.0.0.1:8188)  [default]
 *   'cloud'  → Google Colab / RunPod ComfyUI via tunnel URL
 *
 * The runtime override survives hot-reload (stored on globalThis) but resets
 * on a full server restart — use the .env.local GPU_MODE variable for persistence.
 */

export type GPUMode = 'local' | 'cloud';

// ─── Runtime override (survives HMR, resets on process restart) ──────────────
// We store on globalThis so Turbopack re-imports share the same instance.
declare global {
  // eslint-disable-next-line no-var
  var __gpuModeOverride: GPUMode | undefined;
  // eslint-disable-next-line no-var
  var __cloudComfyUrl: string | undefined;
  // eslint-disable-next-line no-var
  var __cloudComfyWsUrl: string | undefined;
}

/** Get the current active GPU mode. */
export function getGPUMode(): GPUMode {
  return globalThis.__gpuModeOverride ?? ((process.env.GPU_MODE as GPUMode) ?? 'local');
}

/** Programmatically switch mode at runtime (no restart needed). */
export function setGPUModeRuntime(mode: GPUMode, opts?: { comfyUrl?: string; wsUrl?: string }) {
  globalThis.__gpuModeOverride = mode;
  if (opts?.comfyUrl) globalThis.__cloudComfyUrl = opts.comfyUrl;
  if (opts?.wsUrl) globalThis.__cloudComfyWsUrl = opts.wsUrl;
  console.log(`🔄 GPU mode switched to: ${mode}${opts?.comfyUrl ? ` (${opts.comfyUrl})` : ''}`);
}

/** Reset to env-variable default. */
export function resetGPUMode() {
  globalThis.__gpuModeOverride = undefined;
  globalThis.__cloudComfyUrl = undefined;
  globalThis.__cloudComfyWsUrl = undefined;
  console.log(`🔄 GPU mode reset to env default: ${process.env.GPU_MODE ?? 'local'}`);
}

/** Get the active ComfyUI HTTP base URL. */
export function getActiveComfyBaseUrl(): string {
  const mode = getGPUMode();
  if (mode === 'cloud') {
    return (
      globalThis.__cloudComfyUrl ??
      process.env.COLAB_COMFY_URL ??
      'http://127.0.0.1:8188'
    );
  }
  return process.env.COMFY_URL ?? 'http://127.0.0.1:8188';
}

/** Get the active ComfyUI WebSocket URL. */
export function getActiveComfyWsUrl(): string {
  const mode = getGPUMode();
  if (mode === 'cloud') {
    const base = globalThis.__cloudComfyUrl ?? process.env.COLAB_COMFY_URL ?? 'http://127.0.0.1:8188';
    const wsBase = base.replace(/^http/, 'ws').replace(/^https/, 'wss');
    return (
      globalThis.__cloudComfyWsUrl ??
      process.env.COLAB_COMFY_WS_URL ??
      `${wsBase}/ws?clientId=removation_cloud`
    );
  }
  return process.env.COMFY_WS_URL ?? 'ws://127.0.0.1:8188/ws?clientId=removation_main';
}

/** True when using cloud ComfyUI (Colab / RunPod). */
export function isCloudMode(): boolean {
  return getGPUMode() === 'cloud';
}

/**
 * Health-check a ComfyUI instance.
 * Returns { online, vramFree, vramTotal } or throws on timeout.
 */
export async function checkComfyHealth(baseUrl: string, timeoutMs = 5000): Promise<{
  online: boolean;
  vramFree?: number;
  vramTotal?: number;
  error?: string;
}> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`${baseUrl}/system_stats`, {
      signal: controller.signal,
      headers: {
        'bypass-tunnel-reminder': 'true'
      }
    });
    clearTimeout(timer);

    if (!res.ok) return { online: false, error: `HTTP ${res.status}` };

    const data = await res.json();
    const device = data?.devices?.[0];
    return {
      online: true,
      vramFree: device?.vram_free ? Math.round(device.vram_free / 1024 / 1024) : undefined,
      vramTotal: device?.vram_total ? Math.round(device.vram_total / 1024 / 1024) : undefined,
    };
  } catch (err: any) {
    return { online: false, error: err.name === 'AbortError' ? 'Timeout' : err.message };
  }
}
