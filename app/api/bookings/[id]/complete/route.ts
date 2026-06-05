/**
 * POST /api/bookings/[id]/complete
 *
 * Designer marks a booking as completed.
 * Delegates state transition to the workflow engine (transitionId: 'approve').
 * Ownership check is enforced here before delegating.
 *
 * Auth: designer | contractor | admin
 */

import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Booking } from '@/lib/db/models/Booking';
import { Designer } from '@/lib/db/models/Designer';
import { Contractor } from '@/lib/db/models/Contractor';
import { sendSystemMessage } from '@/lib/messages/system';
import { executeTransition } from '@/lib/workflow/engine';

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

        const result = await executeTransition({
            bookingId:       id,
            transitionId:    'approve',
            triggeredById:   user._id.toString(),
            triggeredByRole: user.role,
            req,
        });

        if (!result.success) {
            return NextResponse.json({ message: result.error }, { status: 409 });
        }

        try {
            await sendSystemMessage(booking._id, 'Booking completed. Thank you for working with us!');
        } catch (msgErr) {
            console.error('[complete] Failed to send system message:', msgErr);
        }

        try {
            const { notifyBookingCompleted } = await import('@/lib/notifications/send');
            await notifyBookingCompleted(booking.customerId.toString(), id);
        } catch (notifErr) {
            console.error('[complete] Notification failed:', notifErr);
        }

        return NextResponse.json({
            success:     true,
            status:      result.newState,
            bookingId:   id,
            completedAt: new Date(),
        });

    } catch (error) {
        console.error('[bookings/[id]/complete] POST error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
