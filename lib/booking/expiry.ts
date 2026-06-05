// lib/booking/expiry.ts
//
// On-read expiry check for bookings in `pending_designer` state.
//
// Design: "on-read-check" strategy (Task 4.4 default).
// When any route fetches a booking that is `pending_designer`, it calls
// `checkAndExpireBooking` before returning the result. If `now > designerResponseDeadline`,
// the booking transitions to `expired`, a Razorpay refund is issued, and the
// updated booking is returned. Callers see the booking in its correct final state.
//
// Trade-off vs cron:
//   - Pro: no extra infrastructure; expires exactly when first read after deadline.
//   - Con: a booking is not expired until *someone reads it* after deadline.
//   - This is acceptable for Block 2 — a cron sweep can be added later.
//
// The refund call NEVER throws (see lib/booking/refund.ts). If it fails, the
// booking still transitions to `expired` and `refundFailed` is logged for admin.
//
// This helper expects a HYDRATED Mongoose document (not a lean() result) so it
// can call .save(). Callers that use .lean() must re-fetch if expiry is detected.

import type { Document } from 'mongoose';
import type { IBooking } from '@/lib/db/models/Booking';
import { issueBookingRefund } from './refund';

type BookingDoc = Document<unknown, {}, IBooking> & IBooking & { _id: any };

/**
 * If the booking is `pending_designer` and past its `designerResponseDeadline`,
 * transition it to `expired`, attempt a Razorpay refund, and save.
 *
 * @param booking  A Mongoose document (not lean) — will be mutated and saved.
 * @returns        The (possibly updated) booking document.
 *
 * This function NEVER throws. Refund failures are logged and flagged via
 * `booking.refundId === null` for admin reconciliation.
 */
export async function checkAndExpireBooking(booking: BookingDoc): Promise<BookingDoc> {
    // Only act on pending_designer bookings past their deadline
    if (booking.status !== 'pending_designer') return booking;
    if (!booking.designerResponseDeadline) return booking;
    if (new Date() <= booking.designerResponseDeadline) return booking;

    // ── Transition: pending_designer → expired ──────────────────────────────
    try {
        // Issue refund first (same pattern as reject/cancel routes)
        if (booking.razorpayPaymentId) {
            const refundResult = await issueBookingRefund(
                booking.razorpayPaymentId,
                booking.amount,
                {
                    source: 'booking-expire',
                    bookingId: booking._id.toString(),
                    reason: 'designer_did_not_respond_within_48h',
                }
            );

            if (refundResult.success) {
                booking.refundedAt = new Date();
                booking.refundId = refundResult.refundId;
            } else {
                // Log for admin reconciliation — booking still expires
                console.error(
                    '[expiry] Refund failed during expiry — booking will still expire.',
                    `bookingId=${booking._id.toString()}`,
                    `paymentId=${booking.razorpayPaymentId}`,
                    `error=${refundResult.error}`
                );
            }
        }

        booking.status = 'expired';
        await booking.save();

        console.info(
            '[expiry] Booking expired on read.',
            `bookingId=${booking._id.toString()}`,
            `deadline=${booking.designerResponseDeadline.toISOString()}`,
            `refundIssued=${!!booking.refundId}`
        );
    } catch (err) {
        // .save() failed — do NOT crash the read response, just log
        console.error('[expiry] Failed to save expired booking:', err);
    }

    return booking;
}

/**
 * Check a list of lean booking objects (from .lean() queries) and return
 * the IDs of any that have expired. Callers can use this to know which
 * items need to be re-fetched or updated in the response.
 *
 * This is a lightweight predicate — it does NOT save or refund. It just
 * identifies expired items so the route can decide whether to:
 *   (a) re-fetch each expired item as a hydrated doc and call checkAndExpireBooking, or
 *   (b) filter them out of the response and let the next read trigger expiry
 *
 * Used by list endpoints where re-fetching each expired item would be expensive.
 */
export function findExpiredInList(bookings: Array<{ _id: any; status: string; designerResponseDeadline?: Date | string | null }>): string[] {
    const now = new Date();
    return bookings
        .filter(b => {
            if (b.status !== 'pending_designer') return false;
            if (!b.designerResponseDeadline) return false;
            return now > new Date(b.designerResponseDeadline);
        })
        .map(b => b._id.toString());
}
