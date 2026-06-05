/**
 * GET /api/designer/bookings
 *
 * Returns the calling designer's incoming booking queue.
 * Caller must have a Designer profile (404 if not found).
 *
 * Query params:
 *   ?status=pending_designer|confirmed|...  (optional filter)
 *   ?page=1   (default 1)
 *   ?limit=20 (default 20, max 50)
 *
 * Default filter: pending_designer and confirmed (active bookings requiring attention).
 * Sort: pending_designer bookings first (most urgent), then by createdAt desc.
 *
 * Manual test:
 *   curl "http://localhost:3000/api/designer/bookings" \
 *     -H "Cookie: auth_token=YOUR_DESIGNER_JWT"
 *
 *   curl "http://localhost:3000/api/designer/bookings?status=confirmed" \
 *     -H "Cookie: auth_token=YOUR_DESIGNER_JWT"
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Designer } from '@/lib/db/models/Designer';
import { Booking, BOOKING_STATUSES, type BookingStatus } from '@/lib/db/models/Booking';
import { checkAndExpireBooking, findExpiredInList } from '@/lib/booking/expiry';

export async function GET(req: NextRequest) {
    try {
        // ── Auth ────────────────────────────────────────────────────────────────
        const authResult = await requireRole(req, ['designer', 'admin']);
        if (authResult instanceof NextResponse) return authResult;
        const { user } = authResult;

        await connectToDatabase();

        // ── Find designer profile for this user ────────────────────────────────
        const designer = await Designer.findOne({ userId: user._id });
        if (!designer) {
            return NextResponse.json({ message: 'Designer profile not found' }, { status: 404 });
        }

        // ── Query params ────────────────────────────────────────────────────────
        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
        const skip = (page - 1) * limit;
        const statusParam = searchParams.get('status');

        // Build status filter: if ?status= is provided and valid, use it; else default
        let statusFilter: BookingStatus[];
        if (statusParam && BOOKING_STATUSES.includes(statusParam as BookingStatus)) {
            statusFilter = [statusParam as BookingStatus];
        } else {
            // Default: show active queue — pending_designer (need action) + confirmed
            statusFilter = ['pending_designer', 'confirmed'];
        }

        const query = {
            designerId: designer._id,
            status: { $in: statusFilter },
        };

        let [bookings, total] = await Promise.all([
            Booking.find(query)
                .populate({
                    path: 'customerId',
                    select: 'email firstName lastName imageUrl',
                })
                .sort({
                    // pending_designer first (most urgent), then newest within each group
                    status: -1, // 'pending_designer' sorts before 'confirmed' alphabetically in desc
                    createdAt: -1,
                })
                .skip(skip)
                .limit(limit)
                .lean(),
            Booking.countDocuments(query),
        ]);

        // ── On-read expiry check (Task 4.4) ────────────────────────────────────
        // Find any bookings in the list that have expired. Re-fetch, transition,
        // and update their status. If their new status ('expired') is no longer
        // in statusFilter, we filter them out of the returned list.
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

            // Update status in our lean list and filter out if not matching statusFilter anymore
            bookings = bookings.map(b => {
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
                return b;
            }).filter(b => statusFilter.includes(b.status));
        }

        // Add refundFailed flag to all bookings where applicable
        for (const b of bookings) {
            const isRefundState = ['rejected', 'cancelled_by_customer', 'expired'].includes(b.status);
            (b as any).refundFailed = !!(b.razorpayPaymentId && !b.refundId && isRefundState);
        }

        const pageCount = Math.ceil(total / limit);

        return NextResponse.json({ bookings, total, page, pageCount });
    } catch (error) {
        console.error('[designer/bookings] GET error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
