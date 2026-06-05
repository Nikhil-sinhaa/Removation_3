// app/api/contractor/bookings/route.ts
//
// GET /api/contractor/bookings
//
// Returns the calling contractor's incoming booking queue.
// Caller must have a Contractor profile (404 if not found).
//
// Query params:
//   ?status=pending_designer|confirmed|...  (optional filter)
//   ?page=1   (default 1)
//   ?limit=20 (default 20, max 50)
//
// Default filter: pending_designer and confirmed (active bookings requiring attention).
// Sort: pending_designer bookings first (most urgent), then by createdAt desc.

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Contractor } from '@/lib/db/models/Contractor';
import { Booking, BOOKING_STATUSES, type BookingStatus } from '@/lib/db/models/Booking';
import { checkAndExpireBooking, findExpiredInList } from '@/lib/booking/expiry';

export async function GET(req: NextRequest) {
    try {
        // ── Auth ────────────────────────────────────────────────────────────────
        const authResult = await requireRole(req, ['contractor', 'admin']);
        if (authResult instanceof NextResponse) return authResult;
        const { user } = authResult;

        await connectToDatabase();

        // ── Find contractor profile for this user ──────────────────────────────
        const contractor = await Contractor.findOne({ userId: user._id });
        if (!contractor) {
            return NextResponse.json({ message: 'Contractor profile not found' }, { status: 404 });
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
            contractorId: contractor._id,
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

        // ── On-read expiry check ───────────────────────────────────────────────
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
        console.error('[contractor/bookings] GET error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
