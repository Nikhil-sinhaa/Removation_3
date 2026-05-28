/**
 * GET /api/bookings/me
 *
 * Returns the calling customer's own bookings, paginated, newest first.
 * Populates designer with displayName, city, and first portfolio image (thumbnail).
 *
 * Query params:
 *   ?page=1   (default 1)
 *   ?limit=20 (default 20, max 50)
 *
 * Manual test:
 *   curl "http://localhost:3000/api/bookings/me?page=1&limit=10" \
 *     -H "Cookie: auth_token=YOUR_JWT"
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Booking } from '@/lib/db/models/Booking';
import { checkAndExpireBooking, findExpiredInList } from '@/lib/booking/expiry';

export async function GET(req: NextRequest) {
    try {
        // ── Auth ────────────────────────────────────────────────────────────────
        const authResult = await requireRole(req, ['customer', 'designer', 'contractor', 'admin']);
        if (authResult instanceof NextResponse) return authResult;
        const { user } = authResult;

        // ── Pagination params ──────────────────────────────────────────────────
        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
        const skip = (page - 1) * limit;

        await connectToDatabase();

        const query = { customerId: user._id };

        const [bookings, total] = await Promise.all([
            Booking.find(query)
                .populate({
                    path: 'designerId',
                    select: 'displayName city portfolioImages',
                })
                .populate({
                    path: 'contractorId',
                    select: 'displayName city portfolioImages',
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Booking.countDocuments(query),
        ]);

        // ── On-read expiry check for list (Task 4.4) ────────────────────────────
        // Find any pending_designer bookings that are past their deadline.
        // Re-fetch each as a hydrated doc, run checkAndExpireBooking, then update
        // the lean list so the response reflects the correct expired status.
        const expiredIds = findExpiredInList(bookings);
        const updatedBookingsMap = new Map<string, any>();
        if (expiredIds.length > 0) {
            await Promise.all(
                expiredIds.map(async (expiredId) => {
                    const hydrated = await Booking.findById(expiredId);
                    if (hydrated) {
                        const updated = await checkAndExpireBooking(hydrated as any);
                        updatedBookingsMap.set(expiredId, updated.toObject());
                    }
                })
            );
            // Patch the lean objects in place so the response is accurate
            for (const b of bookings) {
                if (expiredIds.includes(b._id.toString())) {
                    const updated = updatedBookingsMap.get(b._id.toString());
                    if (updated) {
                        (b as any).status = 'expired';
                        (b as any).refundedAt = updated.refundedAt;
                        (b as any).refundId = updated.refundId;
                    } else {
                        (b as any).status = 'expired';
                    }
                }
            }
        }

        // Add refundFailed flag to all bookings where applicable
        for (const b of bookings) {
            const isRefundState = ['rejected', 'cancelled_by_customer', 'expired'].includes(b.status);
            (b as any).refundFailed = !!(b.razorpayPaymentId && !b.refundId && isRefundState);
        }

        // Trim portfolioImages to first element only (thumbnail), to keep payload small
        const bookingsWithThumb = bookings.map((b) => {
            const designer = b.designerId as any;
            if (designer && Array.isArray(designer.portfolioImages)) {
                designer.portfolioImages = designer.portfolioImages.slice(0, 1);
            }
            const contractor = b.contractorId as any;
            if (contractor && Array.isArray(contractor.portfolioImages)) {
                contractor.portfolioImages = contractor.portfolioImages.slice(0, 1);
            }
            return b;
        });

        const pageCount = Math.ceil(total / limit);

        return NextResponse.json({ bookings: bookingsWithThumb, total, page, pageCount });
    } catch (error) {
        console.error('[bookings/me] GET error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
