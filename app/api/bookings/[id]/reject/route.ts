/**
 * POST /api/bookings/[id]/reject
 *
 * Designer rejects a booking, transitioning it from
 * `pending_designer` → `rejected`.
 *
 * Refund: issues a real Razorpay refund via lib/booking/refund.ts.
 * If the refund call fails, the booking still transitions to `rejected`
 * (booking state takes priority) but the response includes refundFailed: true
 * for admin reconciliation. The original payment ID is always preserved
 * on the booking document.
 *
 * Auth: designer role; must own the designer profile that received the booking.
 *
 * Body (required):
 *   { reason: string }  — rejection reason (5–500 chars); required so the customer
 *                         understands why and so there is an audit trail.
 *
 * Guards:
 *   - 404 if booking not found
 *   - 403 if caller is not the receiving designer
 *   - 409 if booking is not in `pending_designer` state
 *
 * Manual test:
 *   curl -X POST http://localhost:3000/api/bookings/BOOKING_ID/reject \
 *     -H "Content-Type: application/json" \
 *     -H "Cookie: auth_token=YOUR_DESIGNER_JWT" \
 *     -d '{ "reason": "I am fully booked during this period." }'
 */

import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Booking } from '@/lib/db/models/Booking';
import { Designer } from '@/lib/db/models/Designer';
import { Contractor } from '@/lib/db/models/Contractor';
import { issueBookingRefund } from '@/lib/booking/refund';

const MIN_REASON_LENGTH = 5;
const MAX_REASON_LENGTH = 500;

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // ── Auth ────────────────────────────────────────────────────────────────
        const authResult = await requireRole(req, ['designer', 'contractor', 'admin']);
        if (authResult instanceof NextResponse) return authResult;
        const { user } = authResult;

        // ── Validate booking ID ─────────────────────────────────────────────────
        const { id } = await params;
        if (!id || !Types.ObjectId.isValid(id)) {
            return NextResponse.json({ message: 'Invalid booking ID' }, { status: 400 });
        }

        // ── Parse body — reason is REQUIRED ────────────────────────────────────
        let reason: string;
        try {
            const body = await req.json();
            if (typeof body?.reason !== 'string' || !body.reason.trim()) {
                return NextResponse.json(
                    { message: 'reason is required' },
                    { status: 400 }
                );
            }
            reason = body.reason.trim();
        } catch {
            return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
        }

        if (reason.length < MIN_REASON_LENGTH) {
            return NextResponse.json(
                { message: `Rejection reason must be at least ${MIN_REASON_LENGTH} characters` },
                { status: 400 }
            );
        }
        if (reason.length > MAX_REASON_LENGTH) {
            return NextResponse.json(
                { message: `Rejection reason cannot exceed ${MAX_REASON_LENGTH} characters` },
                { status: 400 }
            );
        }

        await connectToDatabase();

        // ── Fetch booking ───────────────────────────────────────────────────────
        const booking = await Booking.findById(id);
        if (!booking) {
            return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
        }

        // ── Provider ownership ─────────────────────────────────────────────────
        if (user.role !== 'admin') {
            if (booking.designerId) {
                const designer = await Designer.findOne({ userId: user._id });
                if (!designer || booking.designerId.toString() !== designer._id.toString()) {
                    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
                }
            } else if (booking.contractorId) {
                const contractor = await Contractor.findOne({ userId: user._id });
                if (!contractor || booking.contractorId.toString() !== contractor._id.toString()) {
                    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
                }
            } else {
                return NextResponse.json({ message: 'Invalid booking provider configuration' }, { status: 400 });
            }
        }

        // ── State guard: must be pending_designer ───────────────────────────────
        if (booking.status !== 'pending_designer') {
            return NextResponse.json(
                {
                    message: `Booking cannot be rejected in status "${booking.status}"`,
                    status: booking.status,
                },
                { status: 409 }
            );
        }

        // ── Issue Razorpay refund ───────────────────────────────────────────────
        // Attempt before state transition. If it fails, we still transition to
        // `rejected` so the booking isn't stuck, but we flag it for admin attention.
        let refundFailed = false;
        let refundFailReason: string | undefined;

        if (booking.razorpayPaymentId) {
            const refundResult = await issueBookingRefund(
                booking.razorpayPaymentId,
                booking.amount,
                {
                    source: 'booking-reject',
                    bookingId: booking._id.toString(),
                    reason: reason.slice(0, 100), // Razorpay notes max 100 chars per value
                }
            );

            if (refundResult.success) {
                booking.refundedAt = new Date();
                booking.refundId = refundResult.refundId;
            } else {
                refundFailed = true;
                refundFailReason = refundResult.error;
                console.error(
                    '[bookings/[id]/reject] Refund failed — booking will still transition.',
                    `bookingId=${id}`,
                    `paymentId=${booking.razorpayPaymentId}`,
                    `error=${refundResult.error}`
                );
            }
        } else {
            // No payment recorded (edge case: booking created but payment not verified)
            // Nothing to refund — transition normally.
        }

        // ── Transition: pending_designer → rejected ─────────────────────────────
        booking.status = 'rejected';
        booking.designerRejectedAt = new Date();
        booking.designerRejectionReason = reason;

        await booking.save();

        return NextResponse.json({
            success: true,
            status: booking.status,
            bookingId: booking._id.toString(),
            designerRejectedAt: booking.designerRejectedAt,
            refundId: booking.refundId ?? null,
            refundedAt: booking.refundedAt ?? null,
            // Indicates admin reconciliation needed if true
            refundFailed,
            refundFailReason: refundFailed ? refundFailReason : undefined,
        });

    } catch (error) {
        console.error('[bookings/[id]/reject] POST error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
