/*
Allowed:
  "/"                           → true
  "/admin/designers"            → true
  "/projects/abc-123"           → true
  "/path?q=1&r=2"               → true (query strings ok)
  "/path#section"               → true (fragments ok)

Rejected:
  ""                            → false (empty)
  undefined                     → false (missing)
  null                          → false
  "//evil.com"                  → false (protocol-relative)
  "//evil.com/path"             → false
  "https://evil.com"            → false (absolute URL)
  "http://evil.com"             → false
  "javascript:alert(1)"         → false (XSS vector)
  "data:text/html,..."          → false
  "/\\evil.com"                 → false (backslash protocol-relative)
  "\\evil.com"                  → false
  "/path\\bad"                  → false (any backslash rejected)
  "/" + "a".repeat(600)         → false (too long)
  ["/admin"]                    → false (array, not string)
  "%2F%2Fevil.com"              → false after decoding (// after decode)
*/

export function isSafeRedirectPath(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  if (value.length > 512) {
    return false;
  }

  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch (e) {
    return false;
  }

  if (decoded.length > 512) {
    return false;
  }

  // Must start with exactly one '/'
  if (!decoded.startsWith('/')) {
    return false;
  }

  // Must not start with '//'
  if (decoded.startsWith('//')) {
    return false;
  }

  // Must not start with '/\'
  if (decoded.startsWith('/\\')) {
    return false;
  }

  // Must not contain '://' anywhere
  if (decoded.includes('://')) {
    return false;
  }

  // Must not contain '\' at all
  if (decoded.includes('\\')) {
    return false;
  }

  return true;
}
