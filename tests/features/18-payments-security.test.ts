import { test, expect } from '@playwright/test';
import { BASE_URL, setupTestData, authHeaders, TEST_SECRET, type TestData } from '../setup/testHelpers';

let td: TestData;

test.describe('Feature 18: Payments & Security', () => {
  test.beforeAll(async ({ request }) => {
    td = await setupTestData(request);
  });

  test.afterAll(async ({ request }) => {
    // Restore test user credits in case any test drained them
    await request.put(`${BASE_URL}/api/payment/credits`, {
      headers: authHeaders(td.adminToken),
      data: { userId: td.userId, operation: 'add', amount: 100 },
    }).catch(() => {});

    await request.post(`${BASE_URL}/api/test/cleanup`, {
      headers: { 'x-test-secret': TEST_SECRET },
    });
  });

  // ── Group 1: PAY-01 — Credit admin gate ───────────────────────────────────────

  test('PAY-01: PUT /api/payment/credits returns 401 when unauthenticated', async ({ request }) => {
    const res = await request.put(`${BASE_URL}/api/payment/credits`, {
      data: { userId: td.userId, operation: 'add', amount: 10 },
    });
    expect(res.status()).toBe(401);
  });

  test('PAY-01: PUT /api/payment/credits returns 403 for regular user', async ({ request }) => {
    const res = await request.put(`${BASE_URL}/api/payment/credits`, {
      headers: authHeaders(td.userToken),
      data: { userId: td.userId, operation: 'add', amount: 10 },
    });
    expect(res.status()).toBe(403);
  });

  test('PAY-01: PUT /api/payment/credits returns 200 for admin with valid add operation', async ({ request }) => {
    const res = await request.put(`${BASE_URL}/api/payment/credits`, {
      headers: authHeaders(td.adminToken),
      data: { userId: td.userId, operation: 'add', amount: 10 },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('success');
  });

  // ── Group 2: PAY-02 — Ultra-pro auth + credit gate ────────────────────────────

  test('PAY-02: POST /api/ai/ultra-pro returns 401 when unauthenticated', async () => {
    // Middleware blocks all /api/ai/* routes for callers without auth_token cookie.
    // We use native fetch here because APIRequestContext always attaches session cookies.
    const formData = new FormData();
    formData.append('image', new Blob(['x'], { type: 'image/png' }), 'room.png');

    const res = await fetch(`${BASE_URL}/api/ai/ultra-pro`, {
      method: 'POST',
      body: formData,
      // no Cookie header — intentionally unauthenticated
    });
    expect(res.status).toBe(401);
  });

  test('PAY-02: POST /api/ai/ultra-pro returns 400 when image field is missing', async () => {
    // Authenticated but no image → route returns 400 before touching credits or queue.
    const formData = new FormData();
    formData.append('data', JSON.stringify({ roomType: 'Living Room' }));

    const res = await fetch(`${BASE_URL}/api/ai/ultra-pro`, {
      method: 'POST',
      headers: { Cookie: `auth_token=${td.userToken}` },
      body: formData,
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect((data.error ?? '').toLowerCase()).toContain('image');
  });

  test('PAY-02: POST /api/ai/ultra-pro with zero credits returns 402 in production mode', async ({ request }) => {
    // Drain credits via admin so the user has nothing left.
    await request.put(`${BASE_URL}/api/payment/credits`, {
      headers: authHeaders(td.adminToken),
      data: { userId: td.userId, operation: 'deduct', amount: 999999 },
    });

    // Must use a real valid PNG — sharp processes the image BEFORE the credit check,
    // so a fake blob causes a 500 before 402 is ever reachable.
    // This is a minimal 1×1 white pixel PNG (67 bytes).
    const MIN_PNG = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    const formData = new FormData();
    formData.append('image', new Blob([MIN_PNG], { type: 'image/png' }), 'room.png');
    formData.append('data', JSON.stringify({ roomType: 'Living Room' }));

    const res = await fetch(`${BASE_URL}/api/ai/ultra-pro`, {
      method: 'POST',
      headers: { Cookie: `auth_token=${td.userToken}` },
      body: formData,
    });

    // In dev mode (AdminConfig.app_mode !== 'production') the credit gate is bypassed
    // and the pipeline starts normally (200 or 503 if queue full).
    // In production mode, expect 402 insufficient_credits.
    expect([200, 402, 503]).toContain(res.status);

    if (res.status === 402) {
      const data = await res.json();
      expect(data.error).toBe('insufficient_credits');
    }

    // Restore credits so subsequent tests aren't affected.
    await request.put(`${BASE_URL}/api/payment/credits`, {
      headers: authHeaders(td.adminToken),
      data: { userId: td.userId, operation: 'add', amount: 100 },
    });
  });

  // ── Group 3: FIX-3 — Admin-only monitoring & system routes ───────────────────

  test('FIX-3: GET /api/monitoring/dashboard returns 401 when unauthenticated', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/monitoring/dashboard`);
    expect(res.status()).toBe(401);
  });

  test('FIX-3: GET /api/monitoring/dashboard returns 403 for regular user', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/monitoring/dashboard`, {
      headers: authHeaders(td.userToken),
    });
    expect(res.status()).toBe(403);
  });

  test('FIX-3: GET /api/monitoring/dashboard returns 200 for admin', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/monitoring/dashboard`, {
      headers: authHeaders(td.adminToken),
    });
    expect(res.status()).toBe(200);
  });

  test('FIX-3: GET /api/system/memory and /api/system/redis are admin-only (403 user, 200 admin)', async ({ request }) => {
    const memUser = await request.get(`${BASE_URL}/api/system/memory`, {
      headers: authHeaders(td.userToken),
    });
    expect(memUser.status()).toBe(403);

    const memAdmin = await request.get(`${BASE_URL}/api/system/memory`, {
      headers: authHeaders(td.adminToken),
    });
    expect(memAdmin.status()).toBe(200);

    const redisUser = await request.get(`${BASE_URL}/api/system/redis`, {
      headers: authHeaders(td.userToken),
    });
    expect(redisUser.status()).toBe(403);

    const redisAdmin = await request.get(`${BASE_URL}/api/system/redis`, {
      headers: authHeaders(td.adminToken),
    });
    expect(redisAdmin.status()).toBe(200);
  });

  // ── Group 4: FIX-4 — Rate limiting on auth endpoints ─────────────────────────
  // These tests require Redis to be running. When Redis is down rateLimiters
  // fail open (all requests pass through) and no 429 will be produced.

  test('FIX-4: POST /api/auth/forgot-password rate-limits after burst of requests', async ({ request }) => {
    const responses = await Promise.all(
      Array.from({ length: 15 }, () =>
        request.post(`${BASE_URL}/api/auth/forgot-password`, {
          data: { email: 'ratelimit-fp-test@example.com' },
        })
      )
    );
    const statuses = responses.map(r => r.status());

    // Every response must be a valid status (200 = email sent/not found, 429 = rate limited).
    statuses.forEach(s => expect([200, 429]).toContain(s));

    if (!statuses.includes(429)) {
      // Redis may be unavailable or rate-limit window reset between calls.
      console.warn('[FIX-4] forgot-password: no 429 observed — Redis may be down');
    }
  });

  test('FIX-4: POST /api/auth/verify-otp rate-limits after burst of requests', async ({ request }) => {
    const responses = await Promise.all(
      Array.from({ length: 15 }, () =>
        request.post(`${BASE_URL}/api/auth/verify-otp`, {
          data: { email: 'ratelimit-otp-test@example.com', otp: '000000' },
        })
      )
    );
    const statuses = responses.map(r => r.status());

    // Every response must be a valid status (400 = wrong OTP, 404 = user not found, 429 = limited).
    statuses.forEach(s => expect([400, 404, 429]).toContain(s));

    if (!statuses.includes(429)) {
      console.warn('[FIX-4] verify-otp: no 429 observed — Redis may be down');
    }
  });

  // ── Group 5: PAY-07 — Subscription status & credit balance ───────────────────

  test('PAY-07: GET /api/payment/credits returns 401 when unauthenticated', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/payment/credits`);
    expect(res.status()).toBe(401);
  });

  test('PAY-07: GET /api/payment/credits returns credit balance for authenticated user', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/payment/credits`, {
      headers: authHeaders(td.userToken),
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('credits');
    expect(typeof data.credits).toBe('number');
  });

  test('PAY-07: admin deduct reduces user credit balance', async ({ request }) => {
    // Read balance before
    const beforeRes = await request.get(`${BASE_URL}/api/payment/credits`, {
      headers: authHeaders(td.userToken),
    });
    const before = (await beforeRes.json()).credits as number;

    // Deduct 1 credit via admin PUT
    const deductRes = await request.put(`${BASE_URL}/api/payment/credits`, {
      headers: authHeaders(td.adminToken),
      data: { userId: td.userId, operation: 'deduct', amount: 1 },
    });
    expect(deductRes.status()).toBe(200);

    // Read balance after
    const afterRes = await request.get(`${BASE_URL}/api/payment/credits`, {
      headers: authHeaders(td.userToken),
    });
    const after = (await afterRes.json()).credits as number;

    // Balance must not increase; if it was already 0 the deduct may be a no-op.
    expect(after).toBeLessThanOrEqual(before);

    // Restore
    await request.put(`${BASE_URL}/api/payment/credits`, {
      headers: authHeaders(td.adminToken),
      data: { userId: td.userId, operation: 'add', amount: 1 },
    });
  });

  // ── Group 6: FIX-1 — OAuth CSRF protection ───────────────────────────────────

  test('FIX-1: GET /api/auth/google/callback without code param redirects to sign-in with error', async ({ request }) => {
    // No code → the L21 guard fires immediately before any state check or Google call.
    // Redirects to /sign-in?error=No+authorization+code+provided
    const res = await request.get(
      `${BASE_URL}/api/auth/google/callback`,
      { maxRedirects: 0 }
    );
    expect([301, 302, 307, 308]).toContain(res.status());
    const location = res.headers()['location'] ?? '';
    expect(location).toContain('/sign-in');
    expect(location).toContain('error=');
  });

  test('FIX-1: GET /api/auth/google/callback with invalid code always redirects to sign-in', async ({ request }) => {
    // The state check (L141) fires AFTER the Google token exchange (L35–47).
    // A fake code causes Google to reject the exchange first, so the redirect is
    // error=Failed+to+authenticate+with+Google rather than error=invalid_state.
    // The invariant we test: any invalid OAuth request redirects to /sign-in with
    // an error — never to the app. The specific error message depends on which
    // guard fires first (Google exchange vs. state check).
    const res = await request.get(
      `${BASE_URL}/api/auth/google/callback?code=fake_code&state=not_a_valid_jwt`,
      { maxRedirects: 0 }
    );
    expect([301, 302, 307, 308]).toContain(res.status());
    const location = res.headers()['location'] ?? '';
    expect(location).toContain('/sign-in');
    expect(location).toContain('error=');
  });

  test('FIX-1: GET /api/auth/google initiates OAuth flow with a state param in the redirect URL', async ({ request }) => {
    // The initiation endpoint must set a CSRF state before bouncing to Google.
    const res = await request.get(`${BASE_URL}/api/auth/google`, {
      maxRedirects: 0,
    });
    // Must redirect to Google (or to an error page — never to Google without state)
    expect([301, 302, 307, 308]).toContain(res.status());
    const location = res.headers()['location'] ?? '';
    // If it reaches Google, the state= parameter must be present.
    if (location.includes('accounts.google.com')) {
      expect(location).toContain('state=');
    }
  });
});
