/**
 * GET /api/bookings/[id]
 *
 * Returns full details of a single booking.
 * Accessible by:
 *   - The customer who created the booking (customerId === caller._id)
 *   - The designer who received the booking (designer.userId === caller._id)
 *   - Any admin
 *
 * Auth: requireRole(['customer', 'designer', 'admin'])
 *
 * Manual test:
 *   curl "http://localhost:3000/api/bookings/BOOKING_ID" \
 *     -H "Cookie: auth_token=YOUR_JWT"
 */

import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Booking } from '@/lib/db/models/Booking';
import { Designer } from '@/lib/db/models/Designer';
import { checkAndExpireBooking } from '@/lib/booking/expiry';

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // ── Auth ────────────────────────────────────────────────────────────────
        const authResult = await requireRole(req, ['customer', 'designer', 'admin']);
        if (authResult instanceof NextResponse) return authResult;
        const { user } = authResult;

        // ── Validate ID ─────────────────────────────────────────────────────────
        const { id } = params;
        if (!id || !Types.ObjectId.isValid(id)) {
            return NextResponse.json({ message: 'Invalid booking ID' }, { status: 400 });
        }

        await connectToDatabase();

        // ── Fetch booking (hydrated, not lean — needed for expiry check + save) ─
        const bookingDoc = await Booking.findById(id)
            .populate({ path: 'customerId', select: 'email firstName lastName imageUrl' })
            .populate({ path: 'designerId', select: 'displayName city portfolioImages userId' });

        if (!bookingDoc) {
            return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
        }

        // ── On-read expiry check (Task 4.4) ────────────────────────────────────
        // If pending_designer and past designerResponseDeadline → transition to expired.
        // checkAndExpireBooking never throws; failures are logged for admin.
        await checkAndExpireBooking(bookingDoc as any);

        // ── Access control ──────────────────────────────────────────────────────
        // Admins see everything; customers and designers only see their own bookings.
        if (user.role !== 'admin') {
            const isCustomer = bookingDoc.customerId
                && (bookingDoc.customerId as any)._id?.toString() === user._id.toString();

            // For designer access: compare the designer profile's userId to caller
            const designerDoc = bookingDoc.designerId as any;
            const isDesignerOwner = designerDoc?.userId?.toString() === user._id.toString();

            if (!isCustomer && !isDesignerOwner) {
                return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
            }
        }

        // Return plain object (lean equivalent after hydrated operations)
        const bookingObj = bookingDoc.toObject();
        const isRefundState = ['rejected', 'cancelled_by_customer', 'expired'].includes(bookingObj.status);
        (bookingObj as any).refundFailed = !!(bookingObj.razorpayPaymentId && !bookingObj.refundId && isRefundState);

        return NextResponse.json({ booking: bookingObj });
    } catch (error) {
        console.error('[bookings/[id]] GET error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
