import { NextRequest, NextResponse } from 'next/server';
import { getAllSettings, setSetting } from '@/src/lib/appSettings';
import { setGPUModeRuntime, resetGPUMode } from '@/lib/ai/gpu-mode-router';
import { requireRole } from '@/lib/auth/requireRole';
import { writeAuditLog, auditDescription } from '@/lib/audit/logger';

export const runtime = 'nodejs';

// GET — return current GPU settings
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireRole(req, ['admin']);
    if (authResult instanceof NextResponse) return authResult;

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
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireRole(req, ['admin']);
    if (authResult instanceof NextResponse) return authResult;

    const { mode, cloudUrl } = await req.json();

    const validModes = ['local', 'auto', 'cloud'];
    if (mode && !validModes.includes(mode)) {
      return NextResponse.json(
        { error: 'Invalid mode. Must be local, auto, or cloud' },
        { status: 400 }
      );
    }

    const previousSettings = await getAllSettings();

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

    // Log audit trail
    const extraInfo = `mode=${mode || previousSettings.COMFYUI_MODE}${cloudUrl !== undefined ? `, cloudUrl=${cloudUrl}` : ''}`;
    await writeAuditLog(req, authResult.user, {
      action: 'system.gpu.mode.change',
      category: 'system',
      targetType: 'system',
      targetId: 'gpu_mode',
      targetName: 'GPU Mode Config',
      description: auditDescription('system.gpu.mode.change', 'GPU Mode Config', extraInfo),
      metadata: {
        previousMode: previousSettings.COMFYUI_MODE,
        previousCloudUrl: previousSettings.COMFYUI_CLOUD_URL,
        newMode: mode,
        newCloudUrl: cloudUrl
      }
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

