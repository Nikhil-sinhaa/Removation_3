// lib/booking/refund.ts
//
// Razorpay refund helper for the booking system.
//
// Design principles:
//   - NEVER throws. Returns a discriminated union so callers can proceed with
//     the booking state transition even if Razorpay is down.
//   - Failure is surfaced in the API response (refundFailed: true) so admin
//     dashboards can queue for manual reconciliation.
//   - Only handles the partial/full refund for a booking payment. It does NOT
//     touch booking.status — that is the caller's responsibility.
//
// Usage (reject route):
//   const refundResult = await issueBookingRefund(booking.razorpayPaymentId!, booking.amount);
//   booking.status = 'rejected';
//   if (refundResult.success) {
//     booking.refundedAt = new Date();
//     booking.refundId    = refundResult.refundId;
//   }
//   await booking.save();
//   return NextResponse.json({ ..., refundFailed: !refundResult.success });

import Razorpay from 'razorpay';

// Lazily instantiate so tests/imports don't blow up when env vars are absent
let _razorpay: Razorpay | null = null;
function getRazorpay(): Razorpay {
    if (!_razorpay) {
        _razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
        });
    }
    return _razorpay;
}

// ── Result types ──────────────────────────────────────────────────────────────

export type RefundSuccess = {
    success: true;
    refundId: string;    // Razorpay refund ID (rfnd_xxx)
    amount: number;      // amount refunded in paise
    status: string;      // Razorpay status field ('processed', 'pending', etc.)
};

export type RefundFailure = {
    success: false;
    error: string;       // human-readable reason for admin logs
};

export type RefundResult = RefundSuccess | RefundFailure;

// ── issueBookingRefund ────────────────────────────────────────────────────────

/**
 * Issues a full refund for a booking payment via Razorpay.
 *
 * @param razorpayPaymentId  The payment ID from Razorpay (pay_xxx)
 * @param amountPaise        Amount in paise to refund (must equal booking.amount for full refund)
 * @param notes              Optional notes stored on the Razorpay refund (for audit trail)
 *
 * @returns RefundResult — success with refund details, or failure with error message.
 *          NEVER throws. Callers should proceed with booking state transition regardless.
 *
 * Manual test (requires a real captured payment in test mode):
 *   The refund API only works when razorpayPaymentId is a real captured payment.
 *   In dev/test, use Razorpay test dashboard to capture a payment first.
 *
 * Razorpay docs: https://razorpay.com/docs/api/refunds/create-payment-refund/
 */
export async function issueBookingRefund(
    razorpayPaymentId: string,
    amountPaise: number,
    notes?: Record<string, string>
): Promise<RefundResult> {
    if (!razorpayPaymentId) {
        return {
            success: false,
            error: 'razorpayPaymentId is empty — cannot issue refund',
        };
    }

    if (!amountPaise || amountPaise <= 0) {
        return {
            success: false,
            error: `Invalid refund amount: ${amountPaise} paise`,
        };
    }

    try {
        const razorpay = getRazorpay();

        // Razorpay's payments.refund API:
        //   razorpay.payments.refund(paymentId, { amount, speed, notes })
        // speed: 'normal' (2-5 days) | 'optimum' (2-5 days for most, instant for some)
        const refund = await razorpay.payments.refund(razorpayPaymentId, {
            amount: amountPaise,
            speed: 'normal',
            notes: notes ?? {
                source: 'booking-system',
                reason: 'booking_cancelled_or_rejected',
            },
        });

        return {
            success: true,
            refundId: refund.id,
            amount: typeof refund.amount === 'string'
                ? parseInt(refund.amount, 10)
                : (refund.amount as number),
            status: refund.status as string,
        };
    } catch (err: unknown) {
        const message = err instanceof Error
            ? err.message
            : typeof (err as any)?.error?.description === 'string'
                ? (err as any).error.description
                : JSON.stringify(err);

        console.error(
            '[refund] Razorpay refund failed.',
            `paymentId=${razorpayPaymentId}`,
            `amount=${amountPaise}paise`,
            `error=${message}`
        );

        return {
            success: false,
            error: message,
        };
    }
}
