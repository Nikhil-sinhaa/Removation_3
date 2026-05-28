/**
 * POST /api/reviews
 *
 * Customer submits a review for a completed booking.
 *
 * Auth: any authenticated user role who is the booking's customer.
 * Guards:
 *   - Booking must exist
 *   - Booking must be in `completed` status
 *   - Booking must not have an existing review (booking.reviewId must be null)
 *   - Caller must be the customer who booked it (or admin)
 *   - Inputs must be valid (rating 1-5 integer, comment 10-2000 chars)
 *
 * Updates:
 *   - Creates Review record
 *   - Recalculates averageRating and totalReviews on Designer document via aggregation
 *   - Associates reviewId on Booking document
 */

import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Booking } from '@/lib/db/models/Booking';
import { Designer } from '@/lib/db/models/Designer';
import { Contractor } from '@/lib/db/models/Contractor';
import { Review } from '@/lib/db/models/Review';

export async function POST(req: NextRequest) {
    try {
        // ── Auth Check ──────────────────────────────────────────────────────────
        const authResult = await requireRole(req, ['customer', 'designer', 'contractor', 'admin']);
        if (authResult instanceof NextResponse) return authResult;
        const { user } = authResult;

        // ── Parse & Validate Inputs ─────────────────────────────────────────────
        const body = await req.json().catch(() => ({}));
        const { bookingId, rating, title, comment } = body;

        if (!bookingId || !Types.ObjectId.isValid(bookingId)) {
            return NextResponse.json({ message: 'Invalid or missing bookingId' }, { status: 400 });
        }

        const ratingNum = Number(rating);
        if (isNaN(ratingNum) || !Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            return NextResponse.json({ message: 'Rating must be an integer between 1 and 5' }, { status: 400 });
        }

        if (typeof comment !== 'string' || comment.trim().length < 10 || comment.trim().length > 2000) {
            return NextResponse.json({ message: 'Comment must be between 10 and 2000 characters' }, { status: 400 });
        }

        if (title !== undefined && title !== null && (typeof title !== 'string' || title.trim().length > 100)) {
            return NextResponse.json({ message: 'Title cannot exceed 100 characters' }, { status: 400 });
        }

        await connectToDatabase();

        // ── Fetch Booking ───────────────────────────────────────────────────────
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
        }

        // ── Security Check: Customer matches caller ─────────────────────────────
        if (user.role !== 'admin' && booking.customerId.toString() !== user._id.toString()) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        // ── State Check: Must be completed ──────────────────────────────────────
        if (booking.status !== 'completed') {
            return NextResponse.json(
                { message: `Cannot review a booking in status "${booking.status}". It must be completed first.` },
                { status: 409 }
            );
        }

        // ── Double Review Guard ─────────────────────────────────────────────────
        if (booking.reviewId) {
            return NextResponse.json({ message: 'This booking has already been reviewed' }, { status: 409 });
        }

        const existingReview = await Review.findOne({ bookingId: booking._id });
        if (existingReview) {
            booking.reviewId = existingReview._id as Types.ObjectId;
            await booking.save();
            return NextResponse.json({ message: 'This booking has already been reviewed' }, { status: 409 });
        }

        // ── Create Review document ──────────────────────────────────────────────
        const review = new Review({
            bookingId: booking._id,
            customerId: booking.customerId,
            designerId: booking.designerId || undefined,
            contractorId: booking.contractorId || undefined,
            rating: ratingNum,
            title: title ? title.trim() : undefined,
            comment: comment.trim(),
            isVisible: true,
        });

        await review.save();

        // ── Recalculate aggregates ──────────────────────────────────────────────
        let averageRating = 0;
        let totalReviews = 0;

        if (booking.designerId) {
            const stats = await Review.aggregate([
                { $match: { designerId: booking.designerId, isVisible: true } },
                {
                    $group: {
                        _id: '$designerId',
                        averageRating: { $avg: '$rating' },
                        totalReviews: { $sum: 1 },
                    },
                },
            ]);

            if (stats.length > 0) {
                averageRating = Math.round(stats[0].averageRating * 10) / 10;
                totalReviews = stats[0].totalReviews;
            }

            await Designer.findByIdAndUpdate(booking.designerId, {
                averageRating,
                totalReviews,
            });
        } else if (booking.contractorId) {
            const stats = await Review.aggregate([
                { $match: { contractorId: booking.contractorId, isVisible: true } },
                {
                    $group: {
                        _id: '$contractorId',
                        averageRating: { $avg: '$rating' },
                        totalReviews: { $sum: 1 },
                    },
                },
            ]);

            if (stats.length > 0) {
                averageRating = Math.round(stats[0].averageRating * 10) / 10;
                totalReviews = stats[0].totalReviews;
            }

            await Contractor.findByIdAndUpdate(booking.contractorId, {
                averageRating,
                totalReviews,
            });
        }

        // ── Link Review to Booking ──────────────────────────────────────────────
        booking.reviewId = review._id as Types.ObjectId;
        await booking.save();

        const responseData: any = {
            success: true,
            review: {
                id: review._id.toString(),
                rating: review.rating,
                title: review.title,
                comment: review.comment,
                createdAt: review.createdAt,
            }
        };

        if (booking.designerId) {
            responseData.designerRating = { averageRating, totalReviews };
        } else if (booking.contractorId) {
            responseData.contractorRating = { averageRating, totalReviews };
        }

        return NextResponse.json(responseData, { status: 201 });

    } catch (error) {
        console.error('[reviews] POST error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
