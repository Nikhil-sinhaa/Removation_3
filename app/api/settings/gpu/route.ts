import { NextResponse } from 'next/server';
import { getAllSettings, setSetting } from '@/src/lib/appSettings';
import { setGPUModeRuntime, resetGPUMode } from '@/lib/ai/gpu-mode-router';

export const runtime = 'nodejs';

// GET — return current GPU settings
export async function GET() {
  try {
    const settings = await getAllSettings();
    return NextResponse.json({
      mode:     settings.COMFYUI_MODE,
      cloudUrl: settings.COMFYUI_CLOUD_URL,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST — update GPU settings and apply at runtime
export async function POST(req: Request) {
  try {
    const { mode, cloudUrl } = await req.json();

    const validModes = ['local', 'auto', 'cloud'];
    if (mode && !validModes.includes(mode)) {
      return NextResponse.json(
        { error: 'Invalid mode. Must be local, auto, or cloud' },
        { status: 400 }
      );
    }

    if (mode) {
      await setSetting('COMFYUI_MODE', mode);
      // Apply at runtime immediately (no server restart needed)
      if (mode === 'local') {
        resetGPUMode();
      } else {
        const savedCloudUrl = cloudUrl?.trim() || '';
        setGPUModeRuntime(mode as any, savedCloudUrl ? { comfyUrl: savedCloudUrl } : undefined);
      }
    }

    if (cloudUrl !== undefined) {
      await setSetting('COMFYUI_CLOUD_URL', cloudUrl.trim());
      if (cloudUrl.trim()) {
        // Update runtime cloud URL override
        setGPUModeRuntime(
          (mode ?? 'auto') as any,
          { comfyUrl: cloudUrl.trim() }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
