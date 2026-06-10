/**
 * API Route: GPU Mode Settings
 * GET  /api/settings/gpu-mode → returns current mode + health of both targets
 * POST /api/settings/gpu-mode → switches mode at runtime (no restart needed)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getGPUMode,
  setGPUModeRuntime,
  resetGPUMode,
  checkComfyHealth,
  getActiveComfyBaseUrl,
  type GPUMode,
} from '@/lib/ai/gpu-mode-router';
import { requireRole } from '@/lib/auth/requireRole';
import { setSetting } from '@/src/lib/appSettings';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const authResult = await requireRole(req, ['admin']);
  if (authResult instanceof NextResponse) return authResult;

  const mode = getGPUMode();
  const localUrl = process.env.COMFY_URL ?? 'http://127.0.0.1:8188';
  const cloudUrl = process.env.COLAB_COMFY_URL ?? '';
  const activeUrl = getActiveComfyBaseUrl();

  // Run health checks in parallel
  const [localHealth, cloudHealth] = await Promise.all([
    checkComfyHealth(localUrl),
    cloudUrl ? checkComfyHealth(cloudUrl) : Promise.resolve({ online: false, error: 'No URL configured' }),
  ]);

  return NextResponse.json({
    mode,
    activeUrl,
    local: {
      url: localUrl,
      ...localHealth,
    },
    cloud: {
      url: cloudUrl,
      ...cloudHealth,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireRole(req, ['admin']);
    if (authResult instanceof NextResponse) return authResult;

    const body = await req.json();
    const { mode, cloudUrl } = body as { mode: GPUMode; cloudUrl?: string };

    if (mode !== 'local' && mode !== 'cloud') {
      return NextResponse.json(
        { error: 'Invalid mode. Must be "local" or "cloud".' },
        { status: 400 },
      );
    }

    if (mode === 'cloud') {
      // Validate we have a cloud URL
      const resolvedCloudUrl =
        cloudUrl?.trim() ||
        process.env.COLAB_COMFY_URL ||
        '';

      if (!resolvedCloudUrl) {
        return NextResponse.json(
          { error: 'cloudUrl is required when switching to cloud mode.' },
          { status: 400 },
        );
      }

      // Health-check the cloud target before committing the switch
      const health = await checkComfyHealth(resolvedCloudUrl, 8000);
      if (!health.online) {
        return NextResponse.json(
          {
            error: `Cloud ComfyUI not reachable at ${resolvedCloudUrl}: ${health.error}`,
            tip: 'Make sure your Colab notebook is running and the tunnel URL is correct.',
          },
          { status: 503 },
        );
      }

      setGPUModeRuntime('cloud', { comfyUrl: resolvedCloudUrl });

      // Persist to MongoDB so mode survives PM2 restart
      await setSetting('COMFYUI_MODE', 'cloud');
      await setSetting('COMFYUI_CLOUD_URL', resolvedCloudUrl);

      return NextResponse.json({
        success: true,
        mode: 'cloud',
        cloudUrl: resolvedCloudUrl,
        health,
        message: `✅ Switched to Cloud ComfyUI (${resolvedCloudUrl}) — ${health.vramFree ?? '?'}MB VRAM free`,
      });
    }

    // Switch to local
    const localUrl = process.env.COMFY_URL ?? 'http://127.0.0.1:8188';
    const health = await checkComfyHealth(localUrl, 5000);

    resetGPUMode(); // clears runtime override, falls back to env

    // Persist to MongoDB so mode survives PM2 restart
    await setSetting('COMFYUI_MODE', 'local');

    return NextResponse.json({
      success: true,
      mode: 'local',
      localUrl,
      health,
      message: health.online
        ? `✅ Switched to Local ComfyUI — ${health.vramFree ?? '?'}MB VRAM free`
        : '⚠️ Switched to Local mode, but ComfyUI is not running. Start it first.',
    });
  } catch (err: any) {
    console.error('[gpu-mode] POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
