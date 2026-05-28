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

### [x] JWT_SECRET has insecure fallback default
- **File:** `lib/auth/jwt.ts`
- **Problem:** `const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production'` — if the env var is unset, the app silently signs all auth tokens with a publicly-known string, making every session forgeable. Currently `.env` sets it to `super_secret_jwt_key_here` which is also too weak.
- **Fix:** Replace the fallback with a startup-time throw:
  ```ts
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET env var is required');
  const JWT_SECRET = process.env.JWT_SECRET;
  ```
  In dev, optionally log a warning instead of throwing. Replace `.env` value with a long random string (`openssl rand -hex 32`).
- **Security note:** Anyone who reads the source code can forge admin-level JWTs against any deployment that forgot to set this env var.

### [x] UploadThing routes have no auth (`imageUploader`, `projectImage`, `avatar`)
- **Files:** `app/api/uploadthing/core.ts`
- **Problem:** All three existing UploadThing file routes return a placeholder `userId: "anonymous"` or `userId: "user"` in their middleware. The JWT cookie check is commented out. Anyone with the route URL can upload files to the UploadThing bucket — no account required.
- **Risk:** Storage bill abuse, malicious content upload, free phishing/image hosting.
- **Fix:** Gate all three middleware functions with the same JWT cookie pattern used by the new `designerPortfolio` route:
  ```ts
  const token = req.headers.get('cookie')?.match(/auth_token=([^;]+)/)?.[1];
  const user = token ? verifyJwt(token) : null;
  if (!user) throw new UploadThingError('Unauthorized');
  return { userId: user.id };
  ```
- **Note:** The `designerPortfolio` route added in Goal B gets this right from day one. Apply the same pattern to the three existing routes in a follow-up goal.

### [x] `signOut` vs `logout` Naming Inconsistency
- **Problem:** Custom `AuthProvider` exposes a `logout` function, but some components (originally written under Clerk auth) try to call `signOut`.
- **Status:** Fixed in the main `app/admin/layout.tsx` Header, but may persist in other unmigrated clerk templates across the codebase.

### [ ] User.role is single-valued, can't express multi-role users
- **Problem:** Admin user (`nikhilkumarsinha4321@gmail.com`) is also a designer (owns Priya Interiors). Single string role can be 'admin' OR 'designer', not both.
- **Impact:** Admin can't see Designer Portal in sidebar if role='admin'; can't access /admin/* if role='designer'.
- **Fix later:** Change User.role to User.roles (array of strings); update requireRole and sidebar filter to use array semantics.

## Code Quality & Technical Debt

### [x] `tsc --noEmit` runs out of memory on full project
- **Problem:** Running `npx tsc --noEmit` across the full project causes a V8 OOM crash (exit code 134). The project has ~1,196 files with heavy generic types.
- **Workaround:** Run `tsc` on individual files. Works fine for per-file checks.
- **Fix:** Add `NODE_OPTIONS=--max-old-space-size=8192` to the typecheck script, or set up incremental builds / project references to reduce single-pass memory pressure. Will eventually break CI if left unaddressed.

### [ ] Pre-existing TypeScript/Linting Errors
- **Files:** `/app/api/ai/*`, `/app/api/auth/*`
- **Problem:** Dynamic types and missing declarations causing compiler warnings/errors under strict strict mode configuration.

### [~] Duplicate Database Connectors
- **Files:** `src/lib/mongodb.js` (old JS connector) and `lib/db/mongodb.ts` (new TS connector)
- **Status:** 35/36 files migrated. All `app/api/` routes now import `{ connectDB }` from `@/lib/db/mongodb` or the equivalent relative path. `src/lib/appSettings.js` deferred — it uses `./mongodb.js` as a sibling import and is low-risk to migrate separately.
- **Behavior change:** The old connector used a hardcoded `mongodb://127.0.0.1:27017/removation_ai`. The 35 migrated routes now use `process.env.MONGODB_URI` via the new connector. This is correct and intentional.
- **Remaining:** `src/lib/appSettings.js` still uses `src/lib/mongodb.js`. Migrate in a separate pass.

## UX / Features

### [x] Image Upload for Registration Flow *(Goal B — complete)*
- **Completed:** `useUpload` hook wired to `designerPortfolio` UploadThing route on the register page.
  Server-side URL allowlist validator (`lib/utils/isValidPortfolioImageUrl.ts`) added in Task 5.
  `UPLOADTHING_TOKEN` set in `.env.local` (real credentials, app ID `gv9vbtzjt2`, region `sea1`).

### [x] Three legacy UploadThing routes still unauthenticated *(deferred from Goal B)*
- **Files:** `app/api/uploadthing/core.ts` — `imageUploader`, `projectImage`, `avatar` endpoints
- **Tracked above under Auth section.** Closing once those three get the JWT gate from `designerPortfolio`.

### [ ] Test user passwords overwritten by debug script
- **Accounts affected:** `nikhilkumarsinha4321@gmail.com`, `testuser1@example.com`
- **What happened:** A scratch debugging script (`scratch/set_passwords.js`) set bcrypt password hashes
  on both accounts during visual testing. The admin account was previously Google-OAuth-only (no password field).
- **Current passwords set to:** admin → `AdminPassword123!`, customer → `CustomerPassword123!`
- **Impact:** Password login now works for both. Google OAuth still works independently (callback
  does `User.findOne({ email })` — it doesn't check for a password field, so OAuth is unaffected).
- **Action:** If you want to clear the password from the admin account (back to OAuth-only):
  ```js
  db.users.updateOne({ email: "nikhilkumarsinha4321@gmail.com" }, { $unset: { password: "" } })
  ```

### [x] Sidebar nav link "Professional Design Studio" → /design returns 404
- **Resolved:** The sidebar href is `/professional-design` and `app/(app)/professional-design/page.tsx` exists. No routing issue found. The bug description referenced `/design` but the href was already corrected in a prior session.

## Booking / Marketplace

### [ ] Booking payments rely on client-side verify only (no webhook safety net)
- **Files:** `app/api/bookings/[id]/payment-verify/route.ts`
- **Problem:** If browser crashes/closes after Razorpay charge but before `/payment-verify` lands,
  booking stays in `pending_payment` while Razorpay shows charged.
- **Recovery:** Manual reconciliation via Razorpay dashboard (match `razorpayOrderId` in Booking doc).
- **Fix:** Add booking-payment-captured handling to `app/api/webhook/razorpay/route.ts`.
  Requires webhook to look at `order.notes` for `bookingId`, idempotent skip if booking is past `pending_payment`.

### [~] Auth identity inconsistency: clerkId (legacy) vs _id (new)
- **Files:** `app/api/payment/verify/route.ts`, `app/api/payment/create-checkout/route.ts` (legacy) vs all designer/booking routes (new)
- **Status:** Local variable `clerkId` renamed to `userId` in both files for clarity. `User.findOne({ clerkId: userId })` queries left intact — they work via the pre-save hook (`clerkId = _id.toString()`). Comments added at each lookup explaining the indirection.
- **Remaining:** Routes still use `{ clerkId: userId }` pattern instead of `User.findById(userId)`. Safe until clerkId field is eventually removed.

### [ ] CLAUDE.md line 690 contains stale Clerk-era advice
- **Line:** `"Never query users by _id — always use { clerkId: userId }"`
- **Problem:** This was correct when Clerk was the auth system. Now JWT `id` = MongoDB `_id`, so `User.findOne({ clerkId: userId })` works only via the pre-save hook that copies `_id → clerkId`. New routes (designer, booking) already use `User.findById` correctly via `requireRole`.
- **Fix later:** Remove `clerkId` field, migrate the two payment routes to `User.findById(userId)` directly.

### [ ] Test setup conflates admin and designer identities
- **Files:** `scratch/booking_curl_tests.sh`
- **Problem:** `scratch/booking_curl_tests.sh` uses `ADMIN_COOKIE` for designer actions.
  Only "works" because the admin user happens to own Priya Interiors.
  Real test setup needs two distinct accounts: a non-admin designer and a non-admin customer.
- **Fix:** Fix later when real testing infra is set up.


