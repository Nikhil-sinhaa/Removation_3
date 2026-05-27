// lib/booking/validators.ts
//
// Pure guard functions for booking-related input validation.
// Mirrors the style of lib/auth/safeRedirect.ts: each function is a type predicate
// returning boolean, with no side effects and no I/O.
//
// All date comparisons use the time this module's functions are called, not a
// fixed module-load time — so they are safe to call at request time.

// ── Constants ──────────────────────────────────────────────────────────────────
const MS_IN_MINUTE = 60_000;
const MS_IN_DAY = 24 * 60 * MS_IN_MINUTE;
const CONSULTATION_SLOT_BOUNDARY_MINUTES = 15; // slots must land on :00, :15, :30, :45
const MAX_CONSULTATION_DAYS_AHEAD = 90;
const MAX_PROJECT_START_DAYS_AHEAD = 365;

// ── isValidBookingType ─────────────────────────────────────────────────────────
/**
 * Allowed:
 *   "consultation"  → true
 *   "project"       → true
 *
 * Rejected:
 *   ""              → false
 *   "Consultation"  → false  (case-sensitive)
 *   undefined       → false
 *   null            → false
 *   123             → false
 *   []              → false
 */
export function isValidBookingType(value: unknown): value is 'consultation' | 'project' {
    return value === 'consultation' || value === 'project';
}

// ── isValidConsultationSlot ────────────────────────────────────────────────────
/**
 * Validates a consultation slot date/time.
 *
 * Rules:
 *   - Must be a parseable Date (string, number, or Date accepted)
 *   - Must be in the future (strictly after now)
 *   - Must be at most 90 days from now
 *   - Minutes must be on a 15-minute boundary (:00, :15, :30, :45)
 *   - Seconds and milliseconds are ignored (treated as 0)
 *
 * Allowed:
 *   new Date(now + 1h) with minutes=0   → true
 *   new Date(now + 1h) with minutes=15  → true
 *   new Date(now + 1h) with minutes=30  → true
 *   new Date(now + 1h) with minutes=45  → true
 *   ISO string "2025-09-01T14:00:00Z"   → true (if in valid range)
 *
 * Rejected:
 *   new Date(now - 1min)                → false (past)
 *   new Date(now + 91 days)             → false (too far)
 *   new Date(now + 1h) with minutes=7  → false (not on 15-min boundary)
 *   new Date(now + 1h) with minutes=1  → false
 *   "not-a-date"                        → false
 *   null                                → false
 *   undefined                           → false
 */
export function isValidConsultationSlot(value: unknown): value is Date {
    if (value === null || value === undefined) return false;

    // Accept strings, numbers, and Dates as input — coerce to Date
    const d = value instanceof Date ? value : new Date(value as string | number);

    if (isNaN(d.getTime())) return false;

    const now = Date.now();

    // Must be strictly in the future
    if (d.getTime() <= now) return false;

    // Must be at most 90 days out
    if (d.getTime() > now + MAX_CONSULTATION_DAYS_AHEAD * MS_IN_DAY) return false;

    // Minutes must be on a 15-minute boundary (UTC minutes)
    const minutes = d.getUTCMinutes();
    if (minutes % CONSULTATION_SLOT_BOUNDARY_MINUTES !== 0) return false;

    return true;
}

// ── isValidProjectDescription ──────────────────────────────────────────────────
/**
 * Validates the project description text provided by a customer.
 *
 * Rules:
 *   - Must be a string
 *   - Must be between 20 and 2000 characters (trimmed)
 *
 * Allowed:
 *   "I want to redesign my entire living room..." (≥20 chars)  → true
 *   "A".repeat(2000)                                           → true
 *
 * Rejected:
 *   ""                     → false (empty)
 *   "Short"                → false (<20 chars)
 *   "A".repeat(2001)       → false (>2000 chars)
 *   123                    → false (not a string)
 *   null                   → false
 *   undefined              → false
 *   ["text"]               → false (array)
 */
export function isValidProjectDescription(value: unknown): value is string {
    if (typeof value !== 'string') return false;
    const trimmed = value.trim();
    return trimmed.length >= 20 && trimmed.length <= 2000;
}

// ── isValidPreferredStartDate ──────────────────────────────────────────────────
/**
 * Validates an optional preferred project start date.
 *
 * Rules:
 *   - null is explicitly allowed (customer didn't specify a date)
 *   - undefined is treated the same as null → valid (optional field)
 *   - If present, must parse to a valid Date
 *   - If present, must be in the future (strictly after now)
 *   - If present, must be at most 365 days from now
 *
 * Allowed:
 *   null                          → true  (not specified)
 *   undefined                     → true  (not specified)
 *   new Date(now + 30 days)       → true
 *   "2026-01-01T00:00:00Z"        → true  (if in valid range)
 *
 * Rejected:
 *   new Date(now - 1day)          → false (past)
 *   new Date(now + 366 days)      → false (too far)
 *   "not-a-date"                  → false
 *   12345                         → false (invalid date number — very old timestamp)
 *   []                            → false
 */
export function isValidPreferredStartDate(value: unknown): value is Date | null {
    // null and undefined are explicitly allowed (optional field)
    if (value === null || value === undefined) return true;

    // Reject non-string, non-number, non-Date types early
    if (typeof value !== 'string' && typeof value !== 'number' && !(value instanceof Date)) {
        return false;
    }

    const d = value instanceof Date ? value : new Date(value as string | number);

    if (isNaN(d.getTime())) return false;

    const now = Date.now();

    // Must be strictly in the future
    if (d.getTime() <= now) return false;

    // Must be at most 365 days out
    if (d.getTime() > now + MAX_PROJECT_START_DAYS_AHEAD * MS_IN_DAY) return false;

    return true;
}
