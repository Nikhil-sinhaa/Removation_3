import { NextRequest, NextResponse } from "next/server";
import { comfyUIMonitor } from "@/lib/ai/comfyui-monitoring";
import { comfyUIBridge } from "@/lib/ai/comfyui-bridge";

export async function GET(req: NextRequest) {
  try {
    // Simple health check using bridge
    const isHealthy = await comfyUIBridge.checkHealth();
    
    if (!isHealthy) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'ComfyUI not responding',
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      );
    }
    
    // Get detailed stats if available
    try {
      const health = await comfyUIMonitor.checkSystemHealth();
      
      return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        gpu: {
          name: health.gpu.name,
          vram_usage_percent: health.gpu.vram_total > 0 ? ((health.gpu.vram_used / health.gpu.vram_total) * 100).toFixed(1) : '0',
          temperature: health.gpu.temperature,
          utilization: health.gpu.utilization
        },
        comfyui: {
          running: health.comfyui.running,
          queue_size: health.comfyui.queue_size,
          active_generations: health.comfyui.active_generations
        },
        errors: health.errors
      });
    } catch {
      // Fallback if detailed monitoring fails
      return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        message: 'ComfyUI is running'
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        error: 'Health check failed',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
