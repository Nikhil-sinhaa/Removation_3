import { NextRequest, NextResponse } from 'next/server';
import aiQueueService from '@/services/aiQueue';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, imageUrl, point, mask } = body;

    if (!type || !imageUrl || !point || !mask) {
      return NextResponse.json(
        { error: 'Missing required fields: type, imageUrl, point, mask' },
        { status: 400 }
      );
    }

    // Check if ComfyUI is available
    const status = aiQueueService.getStatus();
    if (status.comfyUIStatus !== 'online') {
      return NextResponse.json(
        { 
          error: 'GPU Service Unavailable',
          message: 'ComfyUI server is not running. Please start the ComfyUI server.',
          code: 'GPU_OFFLINE'
        },
        { status: 503 }
      );
    }

    // Queue the request
    const result = await aiQueueService.enqueue({
      type,
      imageUrl,
      point,
      mask
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('AI Queue error:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const status = aiQueueService.getStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    );
  }
}
