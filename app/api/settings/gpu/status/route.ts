import { NextResponse } from 'next/server';
import { getSetting } from '@/src/lib/appSettings.ts';
import { checkComfyHealth } from '@/lib/ai/gpu-mode-router';

export const runtime = 'nodejs';

const LOCAL_URL = process.env.COMFY_URL ?? 'http://127.0.0.1:8188';

export async function GET() {
  try {
    const mode     = (await getSetting('COMFYUI_MODE')) || 'local';
    const cloudUrl = (await getSetting('COMFYUI_CLOUD_URL')) || '';

    // Run health checks in parallel
    const [localHealth, cloudHealth] = await Promise.all([
      checkComfyHealth(LOCAL_URL, 3000),
      cloudUrl ? checkComfyHealth(cloudUrl, 3000) : Promise.resolve({ online: false } as any),
    ]);

    const localAlive = localHealth.online;
    const cloudAlive = cloudHealth.online;

    // Determine what would actually be used right now
    let activeSource: 'local' | 'cloud' | 'none' = 'none';
    if (mode === 'local') {
      activeSource = localAlive ? 'local' : 'none';
    } else if (mode === 'cloud') {
      activeSource = cloudAlive ? 'cloud' : 'none';
    } else {
      // auto
      activeSource = cloudAlive ? 'cloud' : (localAlive ? 'local' : 'none');
    }

    return NextResponse.json({
      mode,
      cloudUrl,
      localAlive,
      cloudAlive,
      activeSource,
      localVramFree:  localHealth.online ? localHealth.vramFree  : undefined,
      cloudVramFree:  cloudHealth.online ? cloudHealth.vramFree  : undefined,
      statusMessage:
        activeSource === 'cloud' ? '🟢 Using Cloud GPU (T4 15GB)' :
        activeSource === 'local' ? '🟡 Using Local GPU (RTX 4060 8GB)' :
        '🔴 No ComfyUI available',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
