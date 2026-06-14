/**
 * POST /api/ai/jobs/vastu
 *
 * Async entry-point for the GPU-offloaded Vastu pipeline.
 * Mirrors the auth + credit logic from /api/vastu (unchanged synchronous route)
 * but instead of running ComfyUI in-process:
 *   1. Delegates to the shared createVastuJob() helper (lib/ai/createVastuJob.ts)
 *      which fetches the input image as a Buffer, uploads it to Drive, and
 *      creates a GpuJob document (status: 'pending').
 *   2. Returns { success, jobId, status: 'pending' }.
 *
 * The worker daemon (scripts/comfy-worker.mjs) polls /api/ai/jobs/poll,
 * leases the job, runs ComfyUI, uploads 8 mask outputs, then calls
 * /api/ai/jobs/[jobId]/complete.  The client polls
 * GET /api/ai/jobs/[jobId]/status to retrieve the final scored result.
 *
 * ADDITIVE — does NOT modify /api/vastu/route.ts.
 */

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/jwt';
import { checkAndDeductCredits } from '@/lib/ai/deductCredits';
import { connectDB } from '@/lib/db/mongodb';
import { createVastuJob } from '@/lib/ai/createVastuJob';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  await connectDB();

  try {
    // ── Auth ─────────────────────────────────────────────────────────────────
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = authUser.id;

    // ── Parse body ────────────────────────────────────────────────────────────
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { imageUrl, roomType, direction, language = 'en' } = body;

    if (!roomType) {
      return NextResponse.json({ error: 'roomType is required' }, { status: 400 });
    }
    if (!imageUrl) {
      return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 });
    }

    // ── Credit check ──────────────────────────────────────────────────────────
    const creditResult = await checkAndDeductCredits(userId, 'vastu-analysis');
    if (!creditResult.success) {
      return NextResponse.json(
        { error: 'insufficient_credits', message: creditResult.reason },
        { status: 402 },
      );
    }

    // ── Delegate to shared helper ─────────────────────────────────────────────
    let jobId: string;
    try {
      const result = await createVastuJob({
        imageUrl,
        roomType,
        direction,
        language,
        userId,
      });
      jobId = result.jobId;
    } catch (err: any) {
      const is503 = err.message?.includes('Drive not connected') || err.message?.includes('Google Drive');
      return NextResponse.json(
        { error: err.message || 'Failed to create Vastu job' },
        { status: is503 ? 503 : 400 },
      );
    }

    console.log(`[Jobs/Vastu] Created job ${jobId} for user ${userId}`);

    return NextResponse.json({
      success: true,
      jobId,
      status: 'pending',
    });

  } catch (error: any) {
    console.error('❌ /api/ai/jobs/vastu POST error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}
