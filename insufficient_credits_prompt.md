# GOAL: Complete End-to-End Credit Purchase Flow — InsufficientCreditsModal + 402 Intercept

Read `CLAUDE.md` before starting. Do the entire goal in one shot without stopping.

---

## Context — What Already Exists

- **Zustand store** (`stores/user-store.ts`): Already has `insufficientCreditsModalOpen: boolean` state and `setInsufficientCreditsModalOpen(open: boolean)` action. DO NOT change this file.
- **Auth system**: Custom JWT cookie (`auth_token`). Users are fetched via `GET /api/auth/me`. `useAuth()` hook from `components/auth/AuthProvider.tsx` exposes `{ user, refreshUser }`. Always query users by `{ clerkId: userId }`.
- **Payment backend**: `POST /api/payment/credits` — accepts `{ package, paymentMethod, successUrl?, cancelUrl? }`.
  - Stripe: returns `{ type: 'stripe', url }` — redirect to `url`.
  - Razorpay: returns `{ type: 'razorpay', orderId, keyId, amount, currency, name, description, prefill, notes }` — launch Razorpay checkout overlay.
- **Payment verification**: `POST /api/payment/verify` — Razorpay post-payment verification, accepts `{ razorpay_order_id, razorpay_payment_id, razorpay_signature, type: 'credits' }`.
- **Credit packages**:
  | Package    | Credits | INR    | USD   |
  |------------|---------|--------|-------|
  | small      | 25      | ₹799   | $9.99 |
  | medium     | 50      | ₹1,499 | $17.99|
  | large      | 100     | ₹2,499 | $29.99|
  | xlarge     | 250     | ₹4,999 | $59.99|
  | enterprise | 500     | ₹8,499 | $99.99|
- **Existing checkout pattern**: See `components/payment/CheckoutModal.tsx` for Razorpay dynamic script loading and Stripe redirect patterns — replicate the same approach.
- **Razorpay script**: Load dynamically via `document.createElement('script')`, src = `https://checkout.razorpay.com/v1/checkout.js`. See the pattern in `components/booking/BookingModal.tsx` lines 75–110.
- **Currency preference**: `useUserStore(s => s.preferences.currency)` returns `'INR' | 'USD'`. Default to Razorpay for INR, Stripe for USD.
- **Language**: `useLanguage()` from `hooks/useLanguage.ts` returns `{ language }`. Check `language === 'hi'` for Hindi strings.
- **Global providers**: `components/Providers.tsx` — the `<Providers>` component wraps the entire app. Mount the modal here inside the `<TooltipProvider>` block, after `<PreferenceSync />` and before `{children}`.

---

## Phase 1 — Create `components/payment/InsufficientCreditsModal.tsx`

This is a full-screen dialog that appears when any AI generation fails with a 402 status. It lets users buy credits without leaving the page.

### Requirements:
1. **Reads state from Zustand**: `useUserStore(s => s.insufficientCreditsModalOpen)` / `useUserStore(s => s.setInsufficientCreditsModalOpen)`.
2. **Uses `useAuth()`** to get `user` and `refreshUser`.
3. **Currency detection**: `useUserStore(s => s.preferences.currency)` — default Razorpay for INR, Stripe for USD.
4. **Package selection**: Show all 5 packages as selectable cards. Highlight the "large" (100 credits) package as "Most Popular". Show INR price or USD price based on currency. Show credit count prominently.
5. **Payment flow**:
   - POST to `/api/payment/credits` with `{ package: selectedPackage, paymentMethod: 'stripe'|'razorpay', successUrl: window.location.href + '?credits=success', cancelUrl: window.location.href }`.
   - For Stripe: redirect to `data.url`.
   - For Razorpay: load script dynamically, open `new window.Razorpay({ ...data, handler: async (response) => { verify → refreshUser → close modal } })`.
   - On Razorpay payment success: POST to `/api/payment/verify` with `{ ...razorpayResponse, type: 'credits' }`, then call `refreshUser()`, then close modal with `setInsufficientCreditsModalOpen(false)`.
6. **UI states**: idle (package selection), loading (payment initiating), success (credits added), error (payment failed).
7. **Design** — Premium glassmorphism modal:
   - Dark overlay with blur backdrop.
   - Header: warning icon + "You've run out of credits" title + subtitle "Purchase credits to continue generating AI designs".
   - Current balance badge (red/orange) showing `user?.credits ?? 0` remaining.
   - Package cards grid (2×3 responsive). Each card: credit count, price, small "per credit" calculation. Selected = purple ring.
   - Payment method toggle (Stripe/Razorpay) — only show if both available.
   - Primary CTA button: "Buy [N] Credits for [price]" — gradient purple.
   - Secondary link: "Go to billing page" → `/billing`.
   - Close button (X) in top-right.
   - Trust badges row: "Secure Payment · Instant Credits · No Subscription".
8. **Hindi support**: if `language === 'hi'`, use:
   - Title: "क्रेडिट समाप्त हो गए"
   - Subtitle: "AI डिज़ाइन जारी रखने के लिए क्रेडिट खरीदें"
   - CTA: "[N] क्रेडिट [price] में खरीदें"

### File to create:
`components/payment/InsufficientCreditsModal.tsx`

---

## Phase 2 — Mount Modal Globally in `components/Providers.tsx`

In `components/Providers.tsx`, inside the `<TooltipProvider>` block, add:

```tsx
import { InsufficientCreditsModal } from '@/components/payment/InsufficientCreditsModal';
// ... inside <TooltipProvider> block, after <PreferenceSync /> and before {children}:
<InsufficientCreditsModal />
```

The modal reads its own visibility state from Zustand, so no props needed.

---

## Phase 3 — Intercept 402 Errors in All AI Generation Pages

Find every `fetch('/api/ai/...')` call inside `app/(app)/` pages that POSTs to trigger AI generation (not polling/feedback/status), and add a 402 handler.

**Pages to update** (generation POSTs only, not polls or feedback):
1. `app/(app)/room-changer/page.tsx` — line ~188, `fetch("/api/ai/room-changer/generate", ...)`
2. `app/(app)/ceiling-changer/page.tsx` — line ~174, `fetch("/api/ai/ceiling-changer/generate", ...)`
3. `app/(app)/furniture-remover/page.tsx` — line ~422, `fetch("/api/ai/furniture-remover/generate", ...)`
4. `app/(app)/style-transfer/page.tsx` — line ~191, `fetch("/api/ai/style-transfer", ...)`
5. `app/(app)/lighting/page.tsx` — line ~421, `fetch("/api/ai/lighting", ...)`
6. `app/(app)/professional-design/page.tsx` — line ~332, `fetch('/api/ai/ultra-pro', ...)`
7. `app/(app)/master-design/page.tsx` — line ~124, `fetch('/api/ai/redesign', ...)`
8. `app/(app)/ai-design/page.tsx` — line ~135, `fetch('/api/ai/redesign', ...)`
9. `app/(app)/furniture-placement/page.tsx` — line ~134, `fetch('/api/ai/furniture-placement/composite', ...)`
10. `app/(app)/studio/page.tsx` — line ~134, `fetch(\`/api/ai/${tab}\`, ...)`

**Pattern to add after each `const res = await fetch(...)` POST call:**

```tsx
import { useUserStore } from '@/stores/user-store';

// Inside the component:
const setInsufficientCreditsModalOpen = useUserStore(s => s.setInsufficientCreditsModalOpen);

// After the fetch POST:
if (res.status === 402) {
  setInsufficientCreditsModalOpen(true);
  return; // or setIsGenerating(false); return;
}
```

**Important rules**:
- Only add to the initial POST fetch, NOT to the polling fetches.
- Preserve ALL existing error handling — just add the 402 check before the generic error handler.
- Set any loading state to false before returning.
- Each page may use different state variable names (e.g. `setIsLoading`, `setIsGenerating`, `setGenerating`) — check the file and use the correct one.

---

## Phase 4 — Handle `credits=success` URL Param on Return from Stripe

In `app/(app)/layout.tsx` OR the main dashboard page `app/(app)/dashboard/page.tsx`, add a `useEffect` that:
1. Checks `searchParams.get('credits') === 'success'`.
2. If true, calls `refreshUser()` and shows a toast: "Credits purchased successfully!".
3. Clears the URL param using `router.replace(pathname)`.

Use `useSearchParams()` and `useRouter()` from `next/navigation`. Import `useAuth` from `components/auth/AuthProvider`.

Check the existing `app/(app)/billing/page.tsx` to see how it currently handles `credits=success` — if it already handles this, skip this phase and note it.

---

## Acceptance Criteria

1. When any AI generation returns 402, the `InsufficientCreditsModal` opens automatically.
2. User can select a credit package and complete purchase via Razorpay or Stripe.
3. After Razorpay payment, credits are verified, `refreshUser()` is called, modal closes, and the credit balance in the UI updates.
4. After Stripe payment, user lands back on the page with an updated credit balance.
5. Modal is dismissible with the X button.
6. TypeScript compiles without errors.
7. No existing tests or API routes are modified.

---

## Files to Create/Modify

**Create:**
- `components/payment/InsufficientCreditsModal.tsx`

**Modify:**
- `components/Providers.tsx` — add modal mount
- `app/(app)/room-changer/page.tsx` — add 402 handler
- `app/(app)/ceiling-changer/page.tsx` — add 402 handler
- `app/(app)/furniture-remover/page.tsx` — add 402 handler
- `app/(app)/style-transfer/page.tsx` — add 402 handler
- `app/(app)/lighting/page.tsx` — add 402 handler
- `app/(app)/professional-design/page.tsx` — add 402 handler
- `app/(app)/master-design/page.tsx` — add 402 handler
- `app/(app)/ai-design/page.tsx` — add 402 handler
- `app/(app)/furniture-placement/page.tsx` — add 402 handler
- `app/(app)/studio/page.tsx` — add 402 handler
- `app/(app)/dashboard/page.tsx` or `app/(app)/layout.tsx` — handle `credits=success` URL param

**Do NOT modify:**
- `stores/user-store.ts` (already done)
- `app/api/payment/credits/route.ts`
- `app/api/payment/verify/route.ts`
- Any MongoDB models
- Any other API routes

Start immediately. Do not ask for confirmation. Complete all phases.
