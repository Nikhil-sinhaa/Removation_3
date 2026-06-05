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
import { Contractor } from '@/lib/db/models/Contractor';
import { checkAndExpireBooking } from '@/lib/booking/expiry';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // ── Auth ────────────────────────────────────────────────────────────────
        const authResult = await requireRole(req, ['customer', 'designer', 'contractor', 'admin']);
        if (authResult instanceof NextResponse) return authResult;
        const { user } = authResult;

        // ── Validate ID ─────────────────────────────────────────────────────────
        const { id } = await params;
        if (!id || !Types.ObjectId.isValid(id)) {
            return NextResponse.json({ message: 'Invalid booking ID' }, { status: 400 });
        }

        await connectToDatabase();

        // ── Fetch booking ───────────────────────────────────────────────────────
        const bookingDoc = await Booking.findById(id)
            .populate({ path: 'customerId', select: 'email firstName lastName imageUrl' })
            .populate({ path: 'designerId', select: 'displayName city portfolioImages userId' })
            .populate({ path: 'contractorId', select: 'displayName city portfolioImages userId' });

        if (!bookingDoc) {
            return NextResponse.json({ message: 'Booking not found' }, { status: 404 });
        }

        // ── On-read expiry check ───────────────────────────────────────────────
        await checkAndExpireBooking(bookingDoc as any);

        // ── Access control ──────────────────────────────────────────────────────
        if (user.role !== 'admin') {
            const isCustomer = bookingDoc.customerId
                && (bookingDoc.customerId as any)._id?.toString() === user._id.toString();

            const designerDoc = bookingDoc.designerId as any;
            const isDesignerOwner = designerDoc?.userId?.toString() === user._id.toString();

            const contractorDoc = bookingDoc.contractorId as any;
            const isContractorOwner = contractorDoc?.userId?.toString() === user._id.toString();

            if (!isCustomer && !isDesignerOwner && !isContractorOwner) {
                return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
            }
        }

        const bookingObj = bookingDoc.toObject();
        const isRefundState = ['rejected', 'cancelled_by_customer', 'expired'].includes(bookingObj.status);
        (bookingObj as any).refundFailed = !!(bookingObj.razorpayPaymentId && !bookingObj.refundId && isRefundState);

        return NextResponse.json({ booking: bookingObj });
    } catch (error) {
        console.error('[bookings/[id]] GET error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
