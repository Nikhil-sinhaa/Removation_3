/*
 * lib/utils/isValidPortfolioImageUrl.ts
 *
 * Validates that a portfolio image URL came from our UploadThing account.
 *
 * ── Allowed ──────────────────────────────────────────────────────────────────
 *   "https://gv9vbtzjt2.ufs.sh/f/abc123"     → true  (v7 default host)
 *   "https://utfs.io/f/abc123"                → true  (v7 legacy host)
 *
 * ── Rejected ─────────────────────────────────────────────────────────────────
 *   ""                                         → false  (empty)
 *   undefined / null / 42                      → false  (wrong type)
 *   "http://gv9vbtzjt2.ufs.sh/f/abc"          → false  (http, not https)
 *   "https://evil.ufs.sh/f/abc"               → false  (wrong subdomain)
 *   "https://gv9vbtzjt2.ufs.sh.evil.com/f/x"  → false  (hostname spoofing)
 *   "https://utfs.io.evil.com/f/abc"           → false  (hostname spoofing)
 *   "https://imgs.search.brave.com/…"          → false  (not UploadThing)
 *   "/relative/path"                            → false  (no protocol)
 *   "https://gv9vbtzjt2.ufs.sh/" + "a".repeat(2000)  → false  (too long)
 *
 * ── Design notes ─────────────────────────────────────────────────────────────
 * - Uses the URL constructor for robust parsing instead of regex.
 * - Hostname comparison is exact — no suffix matching that could be bypassed
 *   with e.g. "evilgv9vbtzjt2.ufs.sh".
 * - The app ID (gv9vbtzjt2) is baked in: only files from *this* UploadThing
 *   app are accepted. A different app's ufs.sh subdomain won't match.
 * - Both current SDK host patterns are in the allowlist:
 *     • gv9vbtzjt2.ufs.sh   — SDK v7 default (introduced ~v6.4)
 *     • utfs.io              — SDK v7 legacy fallback (still emitted by some versions)
 */

/** App ID decoded from UPLOADTHING_TOKEN, region sea1. */
const UPLOADTHING_APP_ID = 'gv9vbtzjt2';

/** Exact hostnames that UploadThing uses for this account. */
const ALLOWED_HOSTS = new Set([
  `${UPLOADTHING_APP_ID}.ufs.sh`, // v7 default  — e.g. https://gv9vbtzjt2.ufs.sh/f/…
  'utfs.io',                       // v7 legacy   — e.g. https://utfs.io/f/…
]);

const MAX_URL_LENGTH = 1024;

/**
 * Returns true if `value` is a string containing an HTTPS URL served from
 * this project's UploadThing account. Returns false for everything else.
 *
 * Call-site example (register route):
 *   if (!isValidPortfolioImageUrl(img)) {
 *     return NextResponse.json({ message: 'Invalid portfolio image URL' }, { status: 400 });
 *   }
 */
export function isValidPortfolioImageUrl(value: unknown): value is string {
  // ── Type guard ──────────────────────────────────────────────────────────────
  if (typeof value !== 'string') return false;

  // ── Length cap (defence against large-payload DoS via URL parsing) ──────────
  if (value.length > MAX_URL_LENGTH) return false;

  // ── Parse ───────────────────────────────────────────────────────────────────
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false; // not a valid URL at all
  }

  // ── Protocol must be HTTPS ──────────────────────────────────────────────────
  if (url.protocol !== 'https:') return false;

  // ── Hostname must exactly match one of the allowed hosts ────────────────────
  // url.hostname strips the port, lowercases automatically.
  if (!ALLOWED_HOSTS.has(url.hostname)) return false;

  return true;
}
