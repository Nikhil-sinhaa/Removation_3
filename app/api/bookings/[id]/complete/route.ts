/**
 * POST /api/bookings/[id]/complete
 *
 * Designer marks a booking as completed, transitioning it from
 * `confirmed` → `completed`.
 *
 * Auth: designer role; must own the designer profile that received the booking.
 * Guards:
 *   - 404 if booking not found
 *   - 403 if caller is not the receiving designer
 *   - 409 if booking is not in `confirmed` state
 *
 * Manual test:
 *   curl -X POST http://localhost:3000/api/bookings/BOOKING_ID/complete \
 *     -H "Cookie: auth_token=YOUR_DESIGNER_JWT"
 */

import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Booking } from '@/lib/db/models/Booking';
import { Designer } from '@/lib/db/models/Designer';

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // ── Auth ────────────────────────────────────────────────────────────────
        const authResult = await requireRole(req, ['designer', 'admin']);
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

        // ── Designer ownership: find designer profile linked to this user ───────
        // Admins bypass this check.
        if (user.role !== 'admin') {
            const designer = await Designer.findOne({ userId: user._id });
            if (!designer) {
                return NextResponse.json({ message: 'Designer profile not found' }, { status: 404 });
            }
            if (booking.designerId.toString() !== designer._id.toString()) {
                return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
            }
        }

        // ── State guard: must be confirmed ──────────────────────────────────────
        if (booking.status !== 'confirmed') {
            return NextResponse.json(
                {
                    message: `Booking cannot be completed in status "${booking.status}"`,
                    status: booking.status,
                },
                { status: 409 }
            );
        }

        // ── Transition: confirmed → completed ────────────────────────────
        booking.status = 'completed';
        booking.completedAt = new Date();

        await booking.save();

        return NextResponse.json({
            success: true,
            status: booking.status,
            bookingId: booking._id.toString(),
            completedAt: booking.completedAt,
        });

    } catch (error) {
        console.error('[bookings/[id]/complete] POST error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
