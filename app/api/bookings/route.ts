/**
 * POST /api/bookings
 *
 * Creates a new booking for a customer + Razorpay order (upfront payment).
 * Returns the booking ID and Razorpay order details for the frontend to open checkout.
 *
 * Auth: any logged-in user (customer role check: cannot book yourself)
 *
 * Manual test (consultation):
 *   curl -X POST http://localhost:3000/api/bookings \
 *     -H "Content-Type: application/json" \
 *     -H "Cookie: auth_token=YOUR_JWT" \
 *     -d '{
 *       "designerId": "DESIGNER_DOC_ID",
 *       "type": "consultation",
 *       "consultationSlot": "2025-10-01T10:00:00Z"
 *     }'
 *
 * Manual test (project):
 *   curl -X POST http://localhost:3000/api/bookings \
 *     -H "Content-Type: application/json" \
 *     -H "Cookie: auth_token=YOUR_JWT" \
 *     -d '{
 *       "designerId": "DESIGNER_DOC_ID",
 *       "type": "project",
 *       "projectDescription": "Full redesign of my 3BHK apartment living room and master bedroom.",
 *       "projectPreferredStartDate": "2025-11-01T00:00:00Z"
 *     }'
 */

import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { Types } from 'mongoose';
import { requireRole } from '@/lib/auth/requireRole';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Designer } from '@/lib/db/models/Designer';
import { Contractor } from '@/lib/db/models/Contractor';
import { Booking, BOOKING_STATUSES, type BookingStatus } from '@/lib/db/models/Booking';
import {
    isValidBookingType,
    isValidConsultationSlot,
    isValidProjectDescription,
    isValidPreferredStartDate,
} from '@/lib/booking/validators';
import { checkAndExpireBooking, findExpiredInList } from '@/lib/booking/expiry';

// Razorpay client — reuses the same init pattern as app/api/payment/create-checkout/route.ts
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
    try {
        // ── Auth ────────────────────────────────────────────────────────────────
        const authResult = await requireRole(req, ['customer', 'designer', 'contractor', 'admin']);
        if (authResult instanceof NextResponse) return authResult;
        const { user } = authResult;

        // ── Parse body ─────────────────────────────────────────────────────────
        let body: Record<string, unknown>;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
        }

        const { designerId, contractorId, type, consultationSlot, projectDescription, projectPreferredStartDate } = body;

        // ── Validation: provider ID ─────────────────────────────────────────────
        if ((!designerId && !contractorId) || (designerId && contractorId)) {
            return NextResponse.json({ message: 'Provide either designerId or contractorId, not both' }, { status: 400 });
        }

        if (designerId && (typeof designerId !== 'string' || !Types.ObjectId.isValid(designerId))) {
            return NextResponse.json({ message: 'Invalid designerId' }, { status: 400 });
        }

        if (contractorId && (typeof contractorId !== 'string' || !Types.ObjectId.isValid(contractorId))) {
            return NextResponse.json({ message: 'Invalid contractorId' }, { status: 400 });
        }

        // ── Validation: type ───────────────────────────────────────────────────
        if (!isValidBookingType(type)) {
            return NextResponse.json({ message: 'type must be "consultation" or "project"' }, { status: 400 });
        }

        // ── Validation: type-specific fields ───────────────────────────────────
        if (type === 'consultation') {
            if (!consultationSlot) {
                return NextResponse.json({ message: 'consultationSlot is required for consultation bookings' }, { status: 400 });
            }
            if (!isValidConsultationSlot(consultationSlot)) {
                return NextResponse.json(
                    { message: 'consultationSlot must be a future date/time on a 15-minute boundary (e.g. 14:00, 14:15) and at most 90 days from now' },
                    { status: 400 }
                );
            }
        }

        if (type === 'project') {
            if (!projectDescription) {
                return NextResponse.json({ message: 'projectDescription is required for project bookings' }, { status: 400 });
            }
            if (!isValidProjectDescription(projectDescription)) {
                return NextResponse.json({ message: 'projectDescription must be 20–2000 characters' }, { status: 400 });
            }
            if (!isValidPreferredStartDate(projectPreferredStartDate)) {
                return NextResponse.json(
                    { message: 'projectPreferredStartDate must be a future date at most 365 days from now (or null/omitted)' },
                    { status: 400 }
                );
            }
        }

        await connectToDatabase();

        // ── Fetch provider ────────────────────────────────────────────────────
        let designer = null;
        let contractor = null;

        if (designerId) {
            designer = await Designer.findOne({
                _id: new Types.ObjectId(designerId as string),
                isVerified: true,
                isActive: true,
            });
            if (!designer) {
                return NextResponse.json({ message: 'Designer not found' }, { status: 404 });
            }
            if (designer.userId.toString() === user._id.toString()) {
                return NextResponse.json({ message: "You can't book yourself" }, { status: 400 });
            }
            if (type === 'consultation' && !designer.acceptsConsultations) {
                return NextResponse.json({ message: 'This designer is not accepting consultations' }, { status: 400 });
            }
            if (type === 'project' && !designer.acceptsProjects) {
                return NextResponse.json({ message: 'This designer is not accepting project requests' }, { status: 400 });
            }
        } else {
            contractor = await Contractor.findOne({
                _id: new Types.ObjectId(contractorId as string),
                isVerified: true,
                isActive: true,
            });
            if (!contractor) {
                return NextResponse.json({ message: 'Contractor not found' }, { status: 404 });
            }
            if (contractor.userId.toString() === user._id.toString()) {
                return NextResponse.json({ message: "You can't book yourself" }, { status: 400 });
            }
            if (type === 'consultation' && !contractor.acceptsConsultations) {
                return NextResponse.json({ message: 'This contractor is not accepting consultations' }, { status: 400 });
            }
            if (type === 'project' && !contractor.acceptsProjects) {
                return NextResponse.json({ message: 'This contractor is not accepting project requests' }, { status: 400 });
            }
        }

        const provider = designer || contractor;

        if (!provider) {
            return NextResponse.json({ message: 'Provider not found' }, { status: 404 });
        }

        // ── Pricing check ─────────────────────────────────────────────────────
        const feeAmount = type === 'consultation'
            ? provider.consultationFee?.amount ?? 0
            : provider.projectMinFee?.amount ?? 0;

        if (!feeAmount || feeAmount <= 0) {
            return NextResponse.json({ message: "Provider hasn't set pricing for this service" }, { status: 400 });
        }

        const currency = type === 'consultation'
            ? (provider.consultationFee?.currency || 'INR')
            : (provider.projectMinFee?.currency || 'INR');

        // ── Slot conflict check (consultation only) ───────────────────────────
        if (type === 'consultation') {
            const slot = new Date(consultationSlot as string);
            const conflictQuery: Record<string, unknown> = {
                consultationSlot: slot,
                status: { $in: ['pending_payment', 'pending_designer', 'confirmed'] },
            };
            if (designer) {
                conflictQuery.designerId = designer._id;
            } else {
                conflictQuery.contractorId = contractor!._id;
            }

            const conflict = await Booking.findOne(conflictQuery);

            if (conflict) {
                return NextResponse.json(
                    { message: 'This time slot is no longer available. Please pick another.' },
                    { status: 409 }
                );
            }
        }

        // ── Create Razorpay order ─────────────────────────────────────────────
        const shortId = new Types.ObjectId().toHexString().slice(-8); // last 8 hex chars
        const receipt = `bk_${shortId}`;

        let razorpayOrderId: string;
        try {
            const order = await razorpay.orders.create({
                amount: feeAmount, // already in paise
                currency,
                receipt,
                notes: {
                    type: 'booking',
                    bookingType: type,
                    customerId: user._id.toString(),
                    designerId: designer ? designer._id.toString() : null,
                    contractorId: contractor ? contractor._id.toString() : null,
                },
            });
            if (!order || !order.id) {
                throw new Error('Razorpay order creation returned an empty order');
            }
            razorpayOrderId = order.id;
        } catch (rzpErr) {
            console.error('[bookings] Razorpay order creation failed:', rzpErr);
            return NextResponse.json({ message: 'Failed to create payment order. Please try again.' }, { status: 502 });
        }

        // ── Create Booking document ───────────────────────────────────────────
        let booking;
        try {
            const bookingData: Record<string, unknown> = {
                customerId: user._id,
                type,
                amount: feeAmount,
                currency,
                status: 'pending_payment',
                razorpayOrderId: razorpayOrderId,
            };

            if (designer) {
                bookingData.designerId = designer._id;
            } else {
                bookingData.contractorId = contractor!._id;
            }

            if (type === 'consultation') {
                bookingData.consultationSlot = new Date(consultationSlot as string);
                bookingData.consultationDurationMinutes = provider.consultationDurationMinutes ?? 60;
            } else {
                bookingData.projectDescription = (projectDescription as string).trim();
                bookingData.projectPreferredStartDate =
                    projectPreferredStartDate ? new Date(projectPreferredStartDate as string) : null;
            }

            booking = await Booking.create(bookingData);
        } catch (dbErr) {
            console.error(
                '[bookings] Booking doc creation failed after Razorpay order created.',
                'ORPHANED_RAZORPAY_ORDER_ID:', razorpayOrderId,
                'Error:', dbErr
            );
            return NextResponse.json(
                { message: 'Booking could not be saved. Please contact support with reference: ' + razorpayOrderId },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                bookingId: booking._id.toString(),
                razorpayOrderId: razorpayOrderId,
                amount: feeAmount,
                currency,
                key: process.env.RAZORPAY_KEY_ID,
            },
            { status: 201 }
        );

    } catch (error) {
        console.error('[bookings] POST error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        // ── Auth ────────────────────────────────────────────────────────────────
        const authResult = await requireRole(req, ['customer', 'designer', 'contractor', 'admin']);
        if (authResult instanceof NextResponse) return authResult;
        const { user } = authResult;

        await connectToDatabase();

        // ── Query params ────────────────────────────────────────────────────────
        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
        const skip = (page - 1) * limit;
        const statusParam = searchParams.get('status');

        // Build status filter
        let statusFilter: BookingStatus[] | undefined;
        if (statusParam && BOOKING_STATUSES.includes(statusParam as BookingStatus)) {
            statusFilter = [statusParam as BookingStatus];
        }

        const query: Record<string, unknown> = { customerId: user._id };
        if (statusFilter) {
            query.status = { $in: statusFilter };
        }

        const [bookings, total] = await Promise.all([
            Booking.find(query)
                .populate({
                    path: 'designerId',
                    select: 'displayName city portfolioImages userId',
                })
                .populate({
                    path: 'contractorId',
                    select: 'displayName city portfolioImages userId',
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Booking.countDocuments(query),
        ]);

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
            for (const b of bookings) {
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
            }
        }

        for (const b of bookings) {
            const isRefundState = ['rejected', 'cancelled_by_customer', 'expired'].includes(b.status);
            (b as any).refundFailed = !!(b.razorpayPaymentId && !b.refundId && isRefundState);
        }

        const pageCount = Math.ceil(total / limit);

        return NextResponse.json({ bookings, total, page, pageCount });

    } catch (error) {
        console.error('[bookings] GET error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
