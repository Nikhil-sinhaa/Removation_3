/**
 * POST /api/bookings/[id]/reject
 *
 * Designer rejects a booking.
 * Issues Razorpay refund first (non-blocking on failure), then
 * delegates state transition to the workflow engine (transitionId: 'reject').
 *
 * Auth: designer | contractor | admin
 * Body: { reason: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Booking } from '@/lib/db/models/Booking';
import { Designer } from '@/lib/db/models/Designer';
import { Contractor } from '@/lib/db/models/Contractor';
import { issueBookingRefund } from '@/lib/booking/refund';
import { sendSystemMessage } from '@/lib/messages/system';
import { executeTransition } from '@/lib/workflow/engine';

const MIN_REASON_LENGTH = 5;
const MAX_REASON_LENGTH = 500;

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await requireRole(req, ['designer', 'contractor', 'admin']);
        if (authResult instanceof NextResponse) return authResult;
        const { user } = authResult;

        const { id } = await params;
        if (!id || !Types.ObjectId.isValid(id)) {
            return NextResponse.json({ message: 'Invalid booking ID' }, { status: 400 });
        }

        let reason: string;
        try {
            const body = await req.json();
            if (typeof body?.reason !== 'string' || !body.reason.trim()) {
                return NextResponse.json({ message: 'reason is required' }, { status: 400 });
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

        const booking = await Booking.findById(id);
        if (!booking) {
            return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
        }

        // Ownership check — admins bypass
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

        // Issue Razorpay refund before state transition (non-blocking on failure)
        let refundFailed = false;
        let refundFailReason: string | undefined;
        let refundId: string | null = null;
        let refundedAt: Date | null = null;

        if (booking.razorpayPaymentId) {
            const refundResult = await issueBookingRefund(
                booking.razorpayPaymentId,
                booking.amount,
                {
                    source:    'booking-reject',
                    bookingId: booking._id.toString(),
                    reason:    reason.slice(0, 100),
                }
            );

            if (refundResult.success) {
                refundedAt = new Date();
                refundId   = refundResult.refundId;
                // Persist refund fields before executeTransition overwrites booking
                await Booking.findByIdAndUpdate(id, {
                    $set: { refundedAt, refundId, designerRejectedAt: new Date(), designerRejectionReason: reason },
                });
            } else {
                refundFailed     = true;
                refundFailReason = refundResult.error;
                console.error('[bookings/[id]/reject] Refund failed', `bookingId=${id}`, refundResult.error);
            }
        }

        const result = await executeTransition({
            bookingId:       id,
            transitionId:    'reject',
            triggeredById:   user._id.toString(),
            triggeredByRole: user.role,
            message:         reason,
            req,
        });

        if (!result.success) {
            return NextResponse.json({ message: result.error }, { status: 409 });
        }

        try {
            await sendSystemMessage(booking._id, `Booking declined. Reason: ${reason}`);
        } catch (msgErr) {
            console.error('[reject] Failed to send system message:', msgErr);
        }

        try {
            const { notifyBookingRejected } = await import('@/lib/notifications/send');
            const designerName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
            await notifyBookingRejected(booking.customerId.toString(), id, designerName);
        } catch (notifErr) {
            console.error('[reject] Notification failed:', notifErr);
        }

        return NextResponse.json({
            success:          true,
            status:           result.newState,
            bookingId:        id,
            designerRejectedAt: new Date(),
            refundId,
            refundedAt,
            refundFailed,
            refundFailReason: refundFailed ? refundFailReason : undefined,
        });

    } catch (error) {
        console.error('[bookings/[id]/reject] POST error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
