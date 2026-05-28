/**
 * POST /api/ai/furniture-remover/feedback
 * Body: { runId: string, rating: 'up' | 'down', text?: string }
 */

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '../../../../../lib/db/mongodb';
import FurnitureRemoverRun from '../../../../../src/models/FurnitureRemoverRun.js';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  await connectDB();

  let body: { runId?: string; rating?: string; text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { runId, rating, text } = body;

  if (!runId || !mongoose.Types.ObjectId.isValid(runId)) {
    return NextResponse.json({ error: 'Invalid runId' }, { status: 400 });
  }
  if (rating !== 'up' && rating !== 'down') {
    return NextResponse.json({ error: "rating must be 'up' or 'down'" }, { status: 400 });
  }
  if (text !== undefined && text !== null && text.length > 1000) {
    return NextResponse.json({ error: 'text exceeds 1000 characters' }, { status: 400 });
  }

  const run = await FurnitureRemoverRun.findById(runId);
  if (!run) {
    return NextResponse.json({ error: 'Run not found' }, { status: 404 });
  }

  run.feedbackRating = rating;
  run.feedbackText   = text?.trim() || null;
  run.feedbackAt     = new Date();
  await run.save();

  return NextResponse.json({ success: true });
}
