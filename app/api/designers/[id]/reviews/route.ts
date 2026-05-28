/**
 * GET /api/designers/[id]/reviews
 *
 * Public paginated endpoint to list visible reviews for a designer.
 *
 * Query params:
 *   - page: default 1
 *   - limit: default 10 (max 50)
 *
 * Privacy requirement:
 *   - Formats reviewer names to "First Name + Last Initial" (e.g. "Jane D.")
 */

import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Designer } from '@/lib/db/models/Designer';
import { Review } from '@/lib/db/models/Review';
import '@/lib/db/models/User'; // Ensure User model is loaded for populate

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        if (!id || !Types.ObjectId.isValid(id)) {
            return NextResponse.json({ message: 'Invalid designer ID' }, { status: 400 });
        }

        await connectToDatabase();

        // ── Check Designer Existence ─────────────────────────────────────────────
        const designer = await Designer.findById(id);
        if (!designer) {
            return NextResponse.json({ message: 'Designer not found' }, { status: 404 });
        }

        // ── Pagination Query Parameters ──────────────────────────────────────────
        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
        const skip = (page - 1) * limit;

        // ── Fetch Reviews ────────────────────────────────────────────────────────
        // Only return visible reviews
        const total = await Review.countDocuments({ designerId: designer._id, isVisible: true });
        
        const reviews = await Review.find({ designerId: designer._id, isVisible: true })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('customerId', 'firstName lastName imageUrl');

        // ── Format reviewer names securely ───────────────────────────────────────
        const formattedReviews = reviews.map((r) => {
            const customer = r.customerId as any;
            const firstName = customer?.firstName || 'Anonymous';
            const lastInitial = customer?.lastName ? ` ${customer.lastName.charAt(0)}.` : '';
            
            return {
                id: r._id.toString(),
                rating: r.rating,
                title: r.title,
                comment: r.comment,
                designerReply: r.designerReply,
                designerRepliedAt: r.designerRepliedAt,
                createdAt: r.createdAt,
                reviewer: {
                    name: `${firstName}${lastInitial}`.trim(),
                    imageUrl: customer?.imageUrl || null,
                },
            };
        });

        return NextResponse.json({
            success: true,
            reviews: formattedReviews,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        });

    } catch (error) {
        console.error('[designers/[id]/reviews] GET error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
