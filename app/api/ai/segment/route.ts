import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/jwt';
import { checkAndDeductCredits } from '@/lib/ai/deductCredits';
import { tryAcquireRenderLock } from '@/lib/redis/lock';

// Mock SAM 2 segmentation API
// In production, this would integrate with the actual SAM 2 model
export async function POST(request: NextRequest) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const renderLock = await tryAcquireRenderLock(authUser.id, 'segment');
    if (!renderLock) {
      return NextResponse.json({ error: 'render_in_progress', message: 'A render is already in progress for this tool. Please wait a moment.' }, { status: 429 });
    }

    const deductResult = await checkAndDeductCredits(authUser.id, 'segment');
    if (!deductResult.success) {
      return NextResponse.json({
        error: 'insufficient_credits',
        message: deductResult.reason,
        remainingCredits: deductResult.remaining,
        upgradeUrl: '/pricing'
      }, { status: 402 });
    }

    const { imageUrl, point } = await request.json();

    if (!imageUrl || !point) {
      return NextResponse.json(
        { error: 'Missing imageUrl or point' },
        { status: 400 }
      );
    }

    // Simulate SAM 2 processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate a mock mask (in production, this would be actual SAM 2 output)
    const mockMask = generateMockMask(point);

    return NextResponse.json({
      mask: mockMask,
      confidence: 0.95,
      point: point
    });

  } catch (error) {
    console.error('Segmentation error:', error);
    return NextResponse.json(
      { 
        error: 'Segmentation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function generateMockMask(point: { x: number; y: number }): string {
  // Generate a simple circular mask around the point
  const size = 100;
  const canvas = require('canvas').createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Create circular mask
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 3, 0, 2 * Math.PI);
  ctx.fill();
  
  // Convert to base64
  return canvas.toDataURL().split(',')[1];
}
