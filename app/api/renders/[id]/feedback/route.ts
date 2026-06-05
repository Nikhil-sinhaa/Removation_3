import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/jwt';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Render, FEEDBACK_TAGS } from '@/lib/db/models/Render';
import { notifyAdminLowRating } from '@/lib/notifications/send';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const render = await Render.findById(id);
    if (!render) {
      return NextResponse.json({ error: 'Render not found' }, { status: 404 });
    }

    if (render.userId.toString() !== authUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let body: { rating?: unknown; feedbackTags?: unknown; feedbackComment?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { rating, feedbackTags, feedbackComment } = body;

    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'rating must be between 1 and 5' }, { status: 400 });
    }

    const validatedTags: string[] = Array.isArray(feedbackTags)
      ? (feedbackTags as unknown[]).filter(
          (t): t is string => typeof t === 'string' && (FEEDBACK_TAGS as readonly string[]).includes(t)
        )
      : [];

    const trimmedComment =
      typeof feedbackComment === 'string'
        ? feedbackComment.trim().slice(0, 500)
        : '';

    const updatedRender = await Render.findByIdAndUpdate(
      id,
      {
        rating,
        feedbackTags: validatedTags,
        feedbackComment: trimmedComment,
        feedbackSubmittedAt: new Date(),
      },
      { new: true }
    );

    if (rating <= 2 && updatedRender) {
      await notifyAdminLowRating(updatedRender).catch(() => {});
    }

    return NextResponse.json({ success: true, render: updatedRender });
  } catch (err) {
    console.error('[RENDER_FEEDBACK_POST]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const render = await Render.findById(id).select(
      'userId rating feedbackTags feedbackComment feedbackSubmittedAt'
    );
    if (!render) {
      return NextResponse.json({ error: 'Render not found' }, { status: 404 });
    }

    if (render.userId.toString() !== authUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      rating: render.rating ?? null,
      feedbackTags: render.feedbackTags ?? [],
      feedbackComment: render.feedbackComment ?? '',
      feedbackSubmittedAt: render.feedbackSubmittedAt ?? null,
    });
  } catch (err) {
    console.error('[RENDER_FEEDBACK_GET]', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
