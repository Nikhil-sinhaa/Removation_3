/**
 * GET /api/ai/room-changer/runs?runId=...
 * Returns a single RoomChangerRun document.
 */

import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../lib/db/mongodb';
import RoomChangerRun from '../../../../../src/models/RoomChangerRun.js';

export const runtime = 'nodejs';

export async function GET(request) {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const runId = searchParams.get('runId');
  if (!runId) {
    return NextResponse.json({ error: 'runId required' }, { status: 400 });
  }
  try {
    const run = await RoomChangerRun.findById(runId).lean();
    if (!run) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(run);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
