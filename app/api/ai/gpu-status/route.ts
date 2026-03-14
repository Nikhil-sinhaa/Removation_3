import { NextRequest, NextResponse } from 'next/server';
import aiQueueService from '@/services/aiQueue';

export async function GET() {
  try {
    const status = aiQueueService.getStatus();
    
    // Return GPU status in expected format
    return NextResponse.json({
      is_busy: status.isProcessing,
      vram_used: status.gpuStatus?.vram_used || 0,
      temperature: status.gpuStatus?.temperature || 0,
      status: status.comfyUIStatus
    });
  } catch (error) {
    console.error('GPU status check error:', error);
    
    if (error instanceof Error && error.message.includes('offline')) {
      return NextResponse.json(
        { 
          error: 'GPU Service Unavailable',
          message: 'ComfyUI server is not running. Please start the ComfyUI server.',
          code: 'GPU_OFFLINE'
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to check GPU status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
