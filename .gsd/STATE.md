# STATE.md — Project State

> Last updated: 2026-02-21

## Last Session Summary
AI pipeline debugged and E2E testing infrastructure added.
- Fixed 8 bugs in AI generation pipeline (generate, enhance, inpaint, fill-room, outdoor, remove-object, replace, sketch-to-render routes)
- Fixed root cause of "Generation failed" error: `editor/page.tsx` and `editor/[projectId]/page.tsx` expected `data.images[]` but API returns `data.renderIds[]` — rewrote with async polling
- Fixed `Render.clerkId` schema (required → optional), added `isReplicateConfigured()` env guard to all routes
- Fixed Zod enum missing `inpaint` and `remove` modes
- Set up Playwright E2E: `tests/e2e/health.spec.ts` (6 tests), `tests/e2e/redesign.spec.ts`, `tests/e2e/auth.setup.ts`
- All 6 health tests passing (exit code 0)
- Playwright health gate added to `milestone.md` and `VERIFICATION.md` templates

## Current Phase
Not started — awaiting SPEC.md finalization

## Active Context
- Project: Removation.ai (AI-Powered Interior Design & Renovation Platform)
- Stack: Next.js 15, TypeScript, MongoDB, Groq AI, Replicate, Clerk, Stripe/Razorpay
- Status: Brownfield project — AI pipeline fixed, Playwright gate active, ready for /new-project

## Playwright Gate
- `npm run test:health` — mandatory gate for all milestones (6 API health checks, ~30s, no auth)
- `npm run test:auth` — one-time Clerk session capture (run before `test:e2e`)
- `npm run test:e2e` — full redesign pipeline test (requires auth + REPLICATE_API_TOKEN)
