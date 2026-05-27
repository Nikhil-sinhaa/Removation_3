# Known Issues & Technical Debt

## Auth

### [ ] OAuth callback ignores `redirect_url`
- **Files:** `app/api/auth/google/route.ts`, `app/api/auth/google/callback/route.ts`
- **Problem:** When middleware bounces a user to `/sign-in?redirect_url=/some/page`, clicking
  "Sign in with Google" initiates OAuth without passing `redirect_url` as a `state` parameter.
  The callback always hardcodes a redirect to `/` regardless of where the user was trying to go.
- **Fix:** Pass `redirect_url` as `state` in the Google OAuth authorization URL.
  On callback, read `state` back and redirect there post-login.
- **Security note:** The redirect target MUST be validated as a same-origin relative path before
  redirecting — otherwise this becomes an open-redirect vulnerability
  (e.g. `?redirect_url=https://evil.com`).
- **Workaround:** Direct-navigate to admin routes after logging in via `/`.

### [ ] `signOut` vs `logout` Naming Inconsistency
- **Problem:** Custom `AuthProvider` exposes a `logout` function, but some components (originally written under Clerk auth) try to call `signOut`.
- **Status:** Fixed in the main `app/admin/layout.tsx` Header, but may persist in other unmigrated clerk templates across the codebase.

## Code Quality & Technical Debt

### [ ] Pre-existing TypeScript/Linting Errors
- **Files:** `/app/api/ai/*`, `/app/api/auth/*`
- **Problem:** Dynamic types and missing declarations causing compiler warnings/errors under strict strict mode configuration.

### [ ] Duplicate Database Connectors
- **Files:** `src/lib/mongodb.js` and `lib/db/mongodb.ts`
- **Problem:** There are two database connection initializers running in the workspace (one JS, one TS). They should be unified to avoid duplicate mongoose pools.

## UX / Features

### [ ] Image Upload for Registration Flow
- **Problem:** The designer registration form currently takes a text URL input for design/portfolio images instead of an interactive file upload widget.
- **Fix:** Integrate UploadThing or another storage service widget on the registration screen.

