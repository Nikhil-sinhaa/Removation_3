#!/usr/bin/env bash
# ─── Removation.ai Feature Test Suite ──────────────────────────────────────────
# Runs all 18 feature tests against the running dev server.
# Commits each passing feature automatically.
#
# Usage:
#   bash tests/run-all.sh
#
# Prerequisites:
#   npm run dev   (running in another terminal on port 3000)
# ────────────────────────────────────────────────────────────────────────────────

set -euo pipefail

BASE_URL="${TEST_BASE_URL:-http://localhost:3000}"
COMMIT_ON_PASS="${COMMIT_ON_PASS:-true}"
TEST_SECRET="${TEST_SECRET:-test_secret_local}"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Removation.ai Feature Test Suite"
echo "  Server: $BASE_URL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Preflight: server must be running ──────────────────────────────────────────
echo ""
echo "Checking server at $BASE_URL..."
if ! curl -sf --max-time 5 "$BASE_URL" > /dev/null 2>&1; then
  echo "ERROR: Server not responding at $BASE_URL"
  echo "Start it with: npm run dev"
  exit 1
fi
echo "✓ Server is up"

PASSED=()
FAILED=()

run_feature() {
  local num="$1"
  local name="$2"
  local file="$3"

  echo ""
  echo "─────────────────────────────────────────────────────"
  echo "  Feature $num: $name"
  echo "─────────────────────────────────────────────────────"

  if TEST_BASE_URL="$BASE_URL" TEST_SECRET="$TEST_SECRET" \
     npx playwright test "$file" \
       --config=playwright.features.config.ts \
       --reporter=list \
       --timeout=45000 \
       2>&1; then

    echo "✅ PASSED: $name"
    PASSED+=("$name")

    if [[ "$COMMIT_ON_PASS" == "true" ]]; then
      git add -A
      if ! git diff --staged --quiet; then
        git commit -m "$(cat <<EOF
test($num): $name — all tests passing

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
        echo "  → Committed"
      fi
    fi

  else
    echo "❌ FAILED: $name"
    FAILED+=("$name")
  fi
}

# ── Run each feature suite ─────────────────────────────────────────────────────
run_feature "1"  "Audit Logs"            "tests/features/01-audit-logs.test.ts"
run_feature "2"  "Privacy GDPR"          "tests/features/02-privacy-gdpr.test.ts"
run_feature "3"  "Task Scheduler"        "tests/features/03-task-scheduler.test.ts"
run_feature "4"  "Guided Tours"          "tests/features/04-guided-tours.test.ts"
run_feature "5"  "Smart Search"          "tests/features/05-smart-search.test.ts"
run_feature "6"  "Tags"                  "tests/features/06-tags.test.ts"
run_feature "7"  "Redirect Manager"      "tests/features/07-redirect-manager.test.ts"
run_feature "8"  "Workflow Engine"       "tests/features/08-workflow-engine.test.ts"
run_feature "9"  "Schema.org SEO"        "tests/features/09-schema-seo.test.ts"
run_feature "10" "Notification System"   "tests/features/10-notification-system.test.ts"
run_feature "11" "Render Feedback"       "tests/features/11-render-feedback.test.ts"
run_feature "12" "AI Queue"              "tests/features/12-ai-queue.test.ts"
run_feature "13" "Style Transfer"        "tests/features/13-style-transfer.test.ts"
run_feature "14" "Notification Triggers" "tests/features/14-notification-triggers.test.ts"
run_feature "15" "Admin Dashboards"      "tests/features/15-admin-dashboards.test.ts"
run_feature "16" "Security Checks"       "tests/features/16-security-checks.test.ts"
run_feature "17" "Credit Safety"         "tests/features/17-credit-safety.test.ts"
run_feature "18" "Payments Security"     "tests/features/18-payments-security.test.ts"
run_feature "19" "Auth Routes"           "tests/features/19-auth-routes.test.ts"
run_feature "20" "AI Routes Auth"        "tests/features/20-ai-routes-auth.test.ts"
run_feature "21" "Payment Flows"         "tests/features/21-payment-flows.test.ts"

# ── Cleanup test data ──────────────────────────────────────────────────────────
echo ""
echo "Cleaning up test data..."
curl -sf -X POST "$BASE_URL/api/test/cleanup" \
  -H "x-test-secret: $TEST_SECRET" \
  -H "Content-Type: application/json" \
  > /dev/null 2>&1 || true
echo "  → Done"

# ── Summary ────────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  RESULTS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
if [[ ${#PASSED[@]} -gt 0 ]]; then
  echo "  PASSED (${#PASSED[@]}):"
  for f in "${PASSED[@]}"; do echo "    ✅ $f"; done
fi
echo ""
if [[ ${#FAILED[@]} -gt 0 ]]; then
  echo "  FAILED (${#FAILED[@]}):"
  for f in "${FAILED[@]}"; do echo "    ❌ $f"; done
fi
echo ""

if [[ ${#FAILED[@]} -eq 0 ]]; then
  echo "  🎉 All ${#PASSED[@]}/21 features passing!"
else
  echo "  ⚠  ${#FAILED[@]} feature(s) failed"
  exit 1
fi
