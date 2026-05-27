// lib/booking/money.ts
//
// Pure money formatting helpers for the booking system.
// Razorpay (and this codebase) stores amounts in paise (₹1 = 100 paise) to avoid
// floating-point arithmetic issues (e.g. 0.1 + 0.2 !== 0.3 in IEEE 754).
//
// These functions are intentionally side-effect-free and importable on both
// server and client (no Node-only APIs used).

/**
 * Convert paise to a human-readable rupee string.
 *
 * @param paise - Integer amount in paise (e.g. 125000 = ₹1,250)
 * @returns Formatted string with ₹ prefix and 2 decimal places (e.g. "₹1,250.00")
 *
 * Test cases:
 *   paiseToRupees(0)         → "₹0.00"
 *   paiseToRupees(100)       → "₹1.00"
 *   paiseToRupees(125000)    → "₹1,250.00"
 *   paiseToRupees(10000000)  → "₹1,00,000.00"  (Indian number format)
 *   paiseToRupees(50)        → "₹0.50"          (sub-rupee amount)
 *   paiseToRupees(-100)      → "₹-1.00"         (negative — refund display)
 */
export function paiseToRupees(paise: number): string {
    const rupees = paise / 100;
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(rupees);
}

/**
 * Convert a rupee amount (possibly fractional) to paise (integer).
 * Rounds to the nearest paise to handle floating-point inputs safely.
 *
 * @param rupees - Amount in rupees (e.g. 1250.5)
 * @returns Integer paise (e.g. 125050)
 *
 * Test cases:
 *   rupeesToPaise(0)        → 0
 *   rupeesToPaise(1)        → 100
 *   rupeesToPaise(1250)     → 125000
 *   rupeesToPaise(1250.5)   → 125050
 *   rupeesToPaise(0.50)     → 50
 *   rupeesToPaise(0.999)    → 100   (rounds to nearest paise)
 *   rupeesToPaise(100000)   → 10000000  (₹1,00,000 = max allowed per designer fee)
 *
 * Edge cases:
 *   rupeesToPaise(NaN)      → NaN   — caller must validate input first
 *   rupeesToPaise(-1)       → -100  — negative amounts intentionally allowed for callers
 *                                     that compute differences; UI should guard separately
 */
export function rupeesToPaise(rupees: number): number {
    return Math.round(rupees * 100);
}
