# VERIFICATION.md Template

> Copy this template when creating phase verification reports.

```markdown
---
phase: {N}
verified_at: {YYYY-MM-DD HH:MM}
verdict: PASS | FAIL | PARTIAL
pass_count: {X}
total_count: {Y}
---

# Phase {N} Verification Report

## Summary

**{X}/{Y}** must-haves verified
**Verdict:** {PASS | FAIL | PARTIAL}

## Must-Haves

### ✅ 0. Playwright Health Gate (always first)
**Status:** PASS / FAIL
**Method:** `npm run test:health`
**Evidence:**
```
{paste output here — all 6 tests must show ✓}
```

> ⛔ If this fails, stop verification. Fix the API layer before proceeding.

### ✅ 1. {Must-have description}
**Status:** PASS
**Method:** {How this was verified}
**Evidence:**
```
{Actual command output or screenshot reference}
```

### ❌ 2. {Must-have description}
**Status:** FAIL
**Method:** {How this was verified}
**Expected:** {What should happen}
**Actual:** {What actually happened}
**Evidence:**
```
{Actual command output}
```
**Gap:** {What needs to be fixed}

### ⏭️ 3. {Must-have description}
**Status:** SKIPPED
**Reason:** {Why this couldn't be verified}

## Gap Closure Required

{If verdict is FAIL or PARTIAL, list what needs fixing}

1. **{Gap 1}:** {Description of what's wrong and how to fix}
2. **{Gap 2}:** {Description}

## Next Steps

{Based on verdict}

- If PASS: Proceed to next phase
- If FAIL: Run `/execute {N} --gaps-only` after fixing
- If PARTIAL: Address gaps then re-verify
```

## Evidence Types

| Verification | Evidence Required |
|--------------|-------------------|
| **Health gate** | `npm run test:health` output (all ✓) |
| **E2E pipeline** | `npm run test:e2e` output |
| API endpoint | curl command + response |
| UI behavior | Screenshot |
| Test suite | Test output |
| File exists | `ls` or `dir` output |
| Build passes | Build command output |
| Type safety | `npm run type-check` output |
