/**
 * GPU Mode Router
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for which ComfyUI instance the app talks to.
 *
 * Modes:
 *   'local'  → your RTX 4060 machine (127.0.0.1:8188)        [default]
 *   'auto'   → try cloud first (3s ping), fall back to local  [recommended]
 *   'cloud'  → Google Colab / RunPod ComfyUI via tunnel URL
 *
 * Settings are persisted in MongoDB via AppSettings model.
 * The runtime override (globalThis) survives hot-reload but resets on
 * full process restart — MongoDB is the authoritative store.
 */

export type GPUMode = 'local' | 'auto' | 'cloud';

const LOCAL_URL = process.env.COMFY_URL ?? 'http://127.0.0.1:8188';
const HEALTH_TIMEOUT_MS = 3000;

// ─── Runtime override (survives HMR, resets on process restart) ──────────────
declare global {
  // eslint-disable-next-line no-var
  var __gpuModeOverride: GPUMode | undefined;
  // eslint-disable-next-line no-var
  var __cloudComfyUrl: string | undefined;
  // eslint-disable-next-line no-var
  var __cloudComfyWsUrl: string | undefined;
}

/** Get the current active GPU mode (from runtime override, then env). */
export function getGPUMode(): GPUMode {
  return globalThis.__gpuModeOverride ?? ((process.env.GPU_MODE as GPUMode) ?? 'local');
}

/** Programmatically switch mode at runtime (no restart needed). */
export function setGPUModeRuntime(mode: GPUMode, opts?: { comfyUrl?: string; wsUrl?: string }) {
  globalThis.__gpuModeOverride = mode;
  if (opts?.comfyUrl) globalThis.__cloudComfyUrl = opts.comfyUrl;
  if (opts?.wsUrl)    globalThis.__cloudComfyWsUrl = opts.wsUrl;
  console.log(`🔄 GPU mode switched to: ${mode}${opts?.comfyUrl ? ` (${opts.comfyUrl})` : ''}`);
}

/** Reset to env-variable default. */
export function resetGPUMode() {
  globalThis.__gpuModeOverride = undefined;
  globalThis.__cloudComfyUrl   = undefined;
  globalThis.__cloudComfyWsUrl = undefined;
  console.log(`🔄 GPU mode reset to env default: ${process.env.GPU_MODE ?? 'local'}`);
}

/** Ping a ComfyUI URL. Returns true if reachable within timeout. */
async function pingComfyUI(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
    const res = await fetch(`${url}/system_stats`, {
      signal: controller.signal,
      headers: { 'bypass-tunnel-reminder': 'true' },
    });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

/** Get cloud URL from runtime store or env. */
function getCloudUrl(): string {
  return (
    globalThis.__cloudComfyUrl ??
    process.env.COLAB_COMFY_URL ??
    ''
  );
}

/**
 * Resolve the active ComfyUI HTTP base URL.
 *
 * LOCAL → always local
 * CLOUD → cloud URL (throws if unreachable)
 * AUTO  → cloud first (3s ping), local fallback
 */
export async function resolveComfyURL(): Promise<{ url: string; source: 'local' | 'cloud' }> {
  const mode     = getGPUMode();
  const cloudUrl = getCloudUrl();

  if (mode === 'local') {
    return { url: LOCAL_URL, source: 'local' };
  }

  if (mode === 'cloud') {
    if (!cloudUrl) {
      throw new Error(
        'Cloud mode selected but no cloud URL set. ' +
        'Go to Settings → GPU Mode and paste your Colab URL.'
      );
    }
    const alive = await pingComfyUI(cloudUrl);
    if (!alive) {
      throw new Error(
        `Cloud ComfyUI not reachable at ${cloudUrl}. ` +
        'Start your Colab notebook or switch to Local mode.'
      );
    }
    return { url: cloudUrl, source: 'cloud' };
  }

  // AUTO mode — cloud preferred, local fallback
  if (cloudUrl) {
    const alive = await pingComfyUI(cloudUrl);
    if (alive) {
      console.log(`[GPU] AUTO → CLOUD: ${cloudUrl}`);
      return { url: cloudUrl, source: 'cloud' };
    }
    console.log('[GPU] AUTO → cloud unavailable, falling back to local');
  }

  return { url: LOCAL_URL, source: 'local' };
}

/** Get the active ComfyUI HTTP base URL (sync, no health-check — for non-critical use). */
export function getActiveComfyBaseUrl(): string {
  const mode     = getGPUMode();
  const cloudUrl = getCloudUrl();
  if (mode === 'cloud' && cloudUrl) return cloudUrl;
  // auto: optimistically return cloud URL if set; resolveComfyURL() does the real ping
  if (mode === 'auto' && cloudUrl)  return cloudUrl;
  return LOCAL_URL;
}

/** Get the active ComfyUI WebSocket URL (sync). */
export function getActiveComfyWsUrl(): string {
  const mode     = getGPUMode();
  const cloudUrl = getCloudUrl();

  if ((mode === 'cloud' || mode === 'auto') && cloudUrl) {
    const wsBase = cloudUrl.replace(/^https?/, (p) => (p === 'https' ? 'wss' : 'ws'));
    return (
      globalThis.__cloudComfyWsUrl ??
      process.env.COLAB_COMFY_WS_URL ??
      `${wsBase}/ws?clientId=removation_cloud`
    );
  }

  return process.env.COMFY_WS_URL ?? 'ws://127.0.0.1:8188/ws?clientId=removation_main';
}

/** True when using cloud or auto ComfyUI. */
export function isCloudMode(): boolean {
  const mode = getGPUMode();
  return mode === 'cloud' || mode === 'auto';
}

/**
 * Health-check a ComfyUI instance.
 * Returns { online, vramFree, vramTotal } or throws on timeout.
 */
export async function checkComfyHealth(
  baseUrl: string,
  timeoutMs = 5000,
): Promise<{ online: boolean; vramFree?: number; vramTotal?: number; error?: string }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`${baseUrl}/system_stats`, {
      signal: controller.signal,
      headers: { 'bypass-tunnel-reminder': 'true' },
    });
    clearTimeout(timer);

    if (!res.ok) return { online: false, error: `HTTP ${res.status}` };

    const data = await res.json();
    const device = data?.devices?.[0];
    return {
      online: true,
      vramFree:  device?.vram_free  ? Math.round(device.vram_free  / 1024 / 1024) : undefined,
      vramTotal: device?.vram_total ? Math.round(device.vram_total / 1024 / 1024) : undefined,
    };
  } catch (err: any) {
    return { online: false, error: err.name === 'AbortError' ? 'Timeout' : err.message };
  }
}
