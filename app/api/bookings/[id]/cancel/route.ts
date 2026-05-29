/**
 * POST /api/bookings/[id]/cancel
 *
 * Customer cancels a booking that is in `pending_designer` state.
 * Transitions: `pending_designer` → `cancelled_by_customer`.
 *
 * Cancellation is only allowed before the designer has responded (i.e. while
 * status is `pending_designer`). Bookings already `confirmed` are out-of-scope
 * for self-service cancellation (different refund policy, future work).
 *
 * Refund: issues a real Razorpay refund via lib/booking/refund.ts.
 * If the refund call fails, the booking still transitions to `cancelled_by_customer`
 * (booking state takes priority) but the response includes refundFailed: true
 * for admin reconciliation.
 *
 * Auth: customer role; must own the booking.
 *
 * Guards:
 *   - 404 if booking not found
 *   - 403 if caller is not the booking customer
 *   - 409 if booking is not in `pending_designer` state
 *
 * Manual test:
 *   curl -X POST http://localhost:3000/api/bookings/BOOKING_ID/cancel \
 *     -H "Cookie: auth_token=YOUR_JWT"
 */

import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Booking } from '@/lib/db/models/Booking';
import { issueBookingRefund } from '@/lib/booking/refund';

import { sendSystemMessage } from '@/lib/messages/system';

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // ── Auth ────────────────────────────────────────────────────────────────
        const authResult = await requireRole(req, ['customer', 'designer', 'admin']);
        if (authResult instanceof NextResponse) return authResult;
        const { user } = authResult;

        // ── Validate booking ID ─────────────────────────────────────────────────
        const { id } = params;
        if (!id || !Types.ObjectId.isValid(id)) {
            return NextResponse.json({ message: 'Invalid booking ID' }, { status: 400 });
        }

        await connectToDatabase();

        // ── Fetch booking ───────────────────────────────────────────────────────
        const booking = await Booking.findById(id);
        if (!booking) {
            return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
        }

        // ── Ownership check: only the customer who made this booking ────────────
        // Admins bypass (role check above already fetches the DB user).
        if (user.role !== 'admin') {
            if (booking.customerId.toString() !== user._id.toString()) {
                return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
            }
        }

        // ── State guard: can only cancel while pending_designer ─────────────────
        // Once the designer has accepted (confirmed), a different cancellation flow
        // applies (subject to cancellation policy — future work).
        if (booking.status !== 'pending_designer') {
            return NextResponse.json(
                {
                    message: `Booking cannot be cancelled in status "${booking.status}". Only pending bookings (awaiting designer response) can be cancelled.`,
                    status: booking.status,
                },
                { status: 409 }
            );
        }

        // ── Issue Razorpay refund ───────────────────────────────────────────────
        // Attempt before state transition. If it fails, we still transition to
        // `cancelled_by_customer` so the booking isn't stuck, but flag for admin.
        let refundFailed = false;
        let refundFailReason: string | undefined;

        if (booking.razorpayPaymentId) {
            const refundResult = await issueBookingRefund(
                booking.razorpayPaymentId,
                booking.amount,
                {
                    source: 'booking-cancel',
                    bookingId: booking._id.toString(),
                    reason: 'customer_cancelled_before_acceptance',
                }
            );

            if (refundResult.success) {
                booking.refundedAt = new Date();
                booking.refundId = refundResult.refundId;
            } else {
                refundFailed = true;
                refundFailReason = refundResult.error;
                console.error(
                    '[bookings/[id]/cancel] Refund failed — booking will still transition.',
                    `bookingId=${id}`,
                    `paymentId=${booking.razorpayPaymentId}`,
                    `error=${refundResult.error}`
                );
            }
        }

        // ── Transition: pending_designer → cancelled_by_customer ────────────────
        booking.status = 'cancelled_by_customer';
        booking.customerCancelledAt = new Date();

        await booking.save();

        // Send system message
        try {
            await sendSystemMessage(booking._id, 'Booking cancelled by customer.');
        } catch (msgErr) {
            console.error('[cancel] Failed to send system message:', msgErr);
        }

        return NextResponse.json({
            success: true,
            status: booking.status,
            bookingId: booking._id.toString(),
            customerCancelledAt: booking.customerCancelledAt,
            refundId: booking.refundId ?? null,
            refundedAt: booking.refundedAt ?? null,
            // Indicates admin reconciliation needed if true
            refundFailed,
            refundFailReason: refundFailed ? refundFailReason : undefined,
        });

    } catch (error) {
        console.error('[bookings/[id]/cancel] POST error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
