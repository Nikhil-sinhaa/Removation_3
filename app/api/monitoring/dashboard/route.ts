import { NextRequest, NextResponse } from "next/server";
import { comfyUIMonitor } from "@/lib/ai/comfyui-monitoring";
import { comfyUIErrorLogger } from "@/lib/ai/comfyui-errors";

export async function GET(req: NextRequest) {
  try {
    const health = await comfyUIMonitor.checkSystemHealth();
    const recentErrors = comfyUIErrorLogger.getRecentErrors(20);

    return NextResponse.json({
      health,
      recentErrors,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      summary: {
        status: health.status,
        gpu_utilization: health.gpu.utilization,
        vram_usage_percent: ((health.gpu.vram_used / health.gpu.vram_total) * 100).toFixed(1),
        queue_size: health.comfyui.queue_size,
        error_count: recentErrors.filter(e => e.severity === 'error').length,
        warning_count: recentErrors.filter(e => e.severity === 'warning').length
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Dashboard data failed',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
