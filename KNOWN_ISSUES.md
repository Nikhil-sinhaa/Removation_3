# Known Issues & Technical Debt

## Auth

### [x] OAuth callback ignores `redirect_url`
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

### [ ] JWT_SECRET has insecure fallback default
- **File:** `lib/auth/jwt.ts`
- **Problem:** `const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production'` — if the env var is unset, the app silently signs all auth tokens with a publicly-known string, making every session forgeable. Currently `.env` sets it to `super_secret_jwt_key_here` which is also too weak.
- **Fix:** Replace the fallback with a startup-time throw:
  ```ts
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET env var is required');
  const JWT_SECRET = process.env.JWT_SECRET;
  ```
  In dev, optionally log a warning instead of throwing. Replace `.env` value with a long random string (`openssl rand -hex 32`).
- **Security note:** Anyone who reads the source code can forge admin-level JWTs against any deployment that forgot to set this env var.

### [ ] `signOut` vs `logout` Naming Inconsistency
- **Problem:** Custom `AuthProvider` exposes a `logout` function, but some components (originally written under Clerk auth) try to call `signOut`.
- **Status:** Fixed in the main `app/admin/layout.tsx` Header, but may persist in other unmigrated clerk templates across the codebase.

## Code Quality & Technical Debt

### [ ] `tsc --noEmit` runs out of memory on full project
- **Problem:** Running `npx tsc --noEmit` across the full project causes a V8 OOM crash (exit code 134). The project has ~1,196 files with heavy generic types.
- **Workaround:** Run `tsc` on individual files. Works fine for per-file checks.
- **Fix:** Add `NODE_OPTIONS=--max-old-space-size=8192` to the typecheck script, or set up incremental builds / project references to reduce single-pass memory pressure. Will eventually break CI if left unaddressed.

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

