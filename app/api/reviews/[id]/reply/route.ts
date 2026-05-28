/**
 * POST /api/reviews/[id]/reply
 *
 * Designer posts a one-time response reply to a customer review.
 *
 * Auth: designer role; must own the designer profile being reviewed.
 * Guards:
 *   - Review must exist
 *   - Review must not already have a designer reply (one-time reply enforcement)
 *   - Caller must own the designer profile associated with the review
 *   - Inputs must be valid (reply 5-1000 chars)
 */

import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Review } from '@/lib/db/models/Review';
import { Designer } from '@/lib/db/models/Designer';

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // ── Auth Check ──────────────────────────────────────────────────────────
        const authResult = await requireRole(req, ['designer', 'admin']);
        if (authResult instanceof NextResponse) return authResult;
        const { user } = authResult;

        // ── Validate review ID ──────────────────────────────────────────────────
        const { id } = params;
        if (!id || !Types.ObjectId.isValid(id)) {
            return NextResponse.json({ message: 'Invalid review ID' }, { status: 400 });
        }

        // ── Parse & Validate Inputs ─────────────────────────────────────────────
        const body = await req.json().catch(() => ({}));
        const { reply } = body;

        if (typeof reply !== 'string' || reply.trim().length < 5 || reply.trim().length > 1000) {
            return NextResponse.json({ message: 'Reply must be between 5 and 1000 characters' }, { status: 400 });
        }

        await connectToDatabase();

        // ── Fetch Review ────────────────────────────────────────────────────────
        const review = await Review.findById(id);
        if (!review) {
            return NextResponse.json({ message: 'Review not found' }, { status: 404 });
        }

        // ── Security Check: Designer matches caller ─────────────────────────────
        if (user.role !== 'admin') {
            const designer = await Designer.findOne({ userId: user._id });
            if (!designer) {
                return NextResponse.json({ message: 'Designer profile not found' }, { status: 404 });
            }
            if (review.designerId.toString() !== designer._id.toString()) {
                return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
            }
        }

        // ── One-Time Reply Enforcement ──────────────────────────────────────────
        if (review.designerReply) {
            return NextResponse.json({ message: 'You have already replied to this review' }, { status: 409 });
        }

        // ── Save Reply ──────────────────────────────────────────────────────────
        review.designerReply = reply.trim();
        review.designerRepliedAt = new Date();

        await review.save();

        return NextResponse.json({
            success: true,
            reviewId: review._id.toString(),
            designerReply: review.designerReply,
            designerRepliedAt: review.designerRepliedAt,
        });

    } catch (error) {
        console.error('[reviews/[id]/reply] POST error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
