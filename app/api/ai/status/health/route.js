/**
 * API Route for Health Check
 * Handles GET /api/ai/status/health requests
 */

import { NextResponse } from 'next/server';
import { getActiveComfyBaseUrl } from '@/lib/ai/gpu-mode-router';

export async function GET() {
  try {
    const response = await fetch(`${getActiveComfyBaseUrl()}/system_stats`, {
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      throw new Error('ComfyUI not responding');
    }

    const systemStats = await response.json();
    
    return NextResponse.json({
      status: 'healthy',
      comfyUI: 'online',
      system: systemStats.system || {},
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      error: 'ComfyUI offline',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}
