/**
 * POST /api/bookings/[id]/payment-verify
 *
 * Verifies the Razorpay HMAC signature for a booking payment and transitions
 * the booking from `pending_payment` → `pending_designer`.
 *
 * Idempotent: if the booking is already past `pending_payment`, returns 200
 * immediately (handles double-click / network-retry gracefully).
 *
 * Auth: customer only (must be the booking owner)
 *
 * Body:
 *   { razorpayPaymentId: string, razorpayOrderId: string, razorpaySignature: string }
 *
 * Signature algorithm (same as app/api/payment/verify/route.ts one-time flow):
 *   HMAC-SHA256( razorpayOrderId + "|" + razorpayPaymentId, RAZORPAY_KEY_SECRET )
 *
 * Manual test:
 *   curl -X POST http://localhost:3000/api/bookings/BOOKING_ID/payment-verify \
 *     -H "Content-Type: application/json" \
 *     -H "Cookie: auth_token=YOUR_JWT" \
 *     -d '{
 *       "razorpayPaymentId": "pay_xxx",
 *       "razorpayOrderId": "order_xxx",
 *       "razorpaySignature": "abc123..."
 *     }'
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { Types } from 'mongoose';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Booking } from '@/lib/db/models/Booking';

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

        // ── Parse body ──────────────────────────────────────────────────────────
        let body: Record<string, unknown>;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
        }

        const { razorpayPaymentId, razorpayOrderId, razorpaySignature } = body;

        if (
            typeof razorpayPaymentId !== 'string' || !razorpayPaymentId ||
            typeof razorpayOrderId !== 'string' || !razorpayOrderId ||
            typeof razorpaySignature !== 'string' || !razorpaySignature
        ) {
            return NextResponse.json(
                { message: 'razorpayPaymentId, razorpayOrderId, and razorpaySignature are required' },
                { status: 400 }
            );
        }

        await connectToDatabase();

        // ── Fetch booking ───────────────────────────────────────────────────────
        const booking = await Booking.findById(id);
        if (!booking) {
            return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
        }

        // ── Ownership check: only the customer who made this booking ────────────
        if (booking.customerId.toString() !== user._id.toString()) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        // ── Verify Razorpay order ID matches what we stored ─────────────────────
        // This check MUST come before the idempotency return: if we let a request
        // with a wrong orderId through the idempotency gate, a caller could get a
        // misleading 200 implying their payment was valid when it wasn't.
        if (booking.razorpayOrderId !== razorpayOrderId) {
            return NextResponse.json(
                { message: 'razorpayOrderId does not match this booking' },
                { status: 400 }
            );
        }

        // ── Idempotency: already paid (past pending_payment) ────────────────────
        // Handles double-click, browser back, or retried network requests safely.
        // orderId already verified above, so this 200 is safe to return.
        if (booking.status !== 'pending_payment') {
            return NextResponse.json({
                success: true,
                status: booking.status,
                bookingId: booking._id.toString(),
                message: 'Payment already verified',
            });
        }

        // ── Verify HMAC signature ───────────────────────────────────────────────
        // Exact same algorithm as app/api/payment/verify/route.ts (one-time payment branch):
        //   HMAC-SHA256( orderId + "|" + paymentId, RAZORPAY_KEY_SECRET )
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(`${razorpayOrderId}|${razorpayPaymentId}`)
            .digest('hex');

        if (razorpaySignature !== expectedSignature) {
            return NextResponse.json({ message: 'Invalid payment signature' }, { status: 400 });
        }

        // ── Transition booking: pending_payment → pending_designer ──────────────
        const paidAt = new Date();
        const designerResponseDeadline = new Date(paidAt.getTime() + 48 * 60 * 60 * 1000);

        booking.status = 'pending_designer';
        booking.razorpayPaymentId = razorpayPaymentId;
        booking.razorpaySignature = razorpaySignature;
        booking.paidAt = paidAt;
        booking.designerResponseDeadline = designerResponseDeadline;

        await booking.save();

        return NextResponse.json({
            success: true,
            status: booking.status,
            bookingId: booking._id.toString(),
            designerResponseDeadline,
        });

    } catch (error) {
        console.error('[bookings/[id]/payment-verify] POST error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
