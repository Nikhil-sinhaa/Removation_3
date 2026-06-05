/**
 * Feature 16: Security Checks
 *
 * Validates authentication enforcement, role-based access control, cross-user
 * data isolation, and input sanitization across all major API surfaces.
 *
 * No ComfyUI required — all tests use mocked/test data.
 */

import { test, expect } from '@playwright/test';
import { BASE_URL, setupTestData, authHeaders, TEST_SECRET, type TestData } from '../setup/testHelpers';

let td: TestData;

const seedHeaders = { 'x-test-secret': TEST_SECRET, 'Content-Type': 'application/json' };

async function seedNotification(userId: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/test/notifications/seed`, {
    method: 'POST',
    headers: seedHeaders,
    body: JSON.stringify({ userId, count: 1 }),
  });
  const data = await res.json();
  return data.notificationIds[0];
}

async function createRender(token: string, userId: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/renders`, {
    method: 'POST',
    headers: { ...authHeaders(token) },
    body: JSON.stringify({ inputImage: 'test.jpg', mode: 'redesign', userId, clerkId: userId, status: 'completed' }),
  });
  const data = await res.json();
  return data._id ?? data.id;
}

test.describe('Feature 16: Security Checks', () => {
  test.beforeAll(async ({ request }) => {
    td = await setupTestData(request);
  });

  test.afterAll(async ({ request }) => {
    await request.post(`${BASE_URL}/api/test/cleanup`, {
      headers: { 'x-test-secret': TEST_SECRET },
    });
  });

  // ── 1. Unauthenticated access returns 401 across all surfaces ─────────────────

  test.describe('Unauthenticated requests return 401', () => {
    const unauthRoutes: Array<{ method: string; path: string; body?: object }> = [
      { method: 'GET',    path: '/api/notifications' },
      { method: 'POST',   path: '/api/notifications/read', body: { all: true } },
      { method: 'GET',    path: '/api/renders' },
      { method: 'POST',   path: '/api/renders', body: { inputImage: 'x', mode: 'redesign' } },
      { method: 'GET',    path: '/api/admin/stats' },
      { method: 'GET',    path: '/api/admin/analytics' },
      { method: 'GET',    path: '/api/admin/renders' },
      { method: 'GET',    path: '/api/admin/queue' },
      { method: 'GET',    path: '/api/admin/feedback/stats' },
      { method: 'GET',    path: '/api/admin/scheduler' },
      { method: 'GET',    path: '/api/ai/queue?jobId=x' },
    ];

    for (const { method, path, body } of unauthRoutes) {
      test(`${method} ${path} without auth returns 401`, async ({ request }) => {
        const options = body ? { data: body } : {};
        const res = await (request as any)[method.toLowerCase()](`${BASE_URL}${path}`, options);
        expect(res.status(), `${method} ${path}`).toBe(401);
      });
    }
  });

  // ── 2. Regular user cannot access admin routes (403) ─────────────────────────

  test.describe('Regular user is forbidden from admin routes', () => {
    const adminRoutes = [
      '/api/admin/stats',
      '/api/admin/analytics',
      '/api/admin/renders',
      '/api/admin/queue',
      '/api/admin/feedback/stats',
      '/api/admin/scheduler',
      '/api/admin/audit-logs',
    ];

    for (const path of adminRoutes) {
      test(`GET ${path} returns 403 for regular user`, async ({ request }) => {
        const res = await request.get(`${BASE_URL}${path}`, {
          headers: authHeaders(td.userToken),
        });
        expect(res.status(), `${path}`).toBe(403);
      });
    }
  });

  // ── 3. Cross-user data isolation — renders ────────────────────────────────────

  test('GET /api/renders/{id} returns 404 when another user tries to access it', async ({ request }) => {
    const renderId = await createRender(td.userToken, td.userId);

    // Admin tries to read user's render — ownership check returns 404 for non-admin
    // (note: admin can see all renders in this system, so use designer as the other user)
    const res = await request.get(`${BASE_URL}/api/renders/${renderId}`, {
      headers: authHeaders(td.designerToken),
    });
    // Route returns 404 to avoid leaking existence
    expect([403, 404]).toContain(res.status());
  });

  test('DELETE /api/renders/{id} returns 404 when another user tries to delete it', async ({ request }) => {
    const renderId = await createRender(td.userToken, td.userId);

    const res = await request.delete(`${BASE_URL}/api/renders/${renderId}`, {
      headers: authHeaders(td.designerToken),
    });
    expect([403, 404]).toContain(res.status());
  });

  // ── 4. Cross-user feedback access denied ─────────────────────────────────────

  test('POST /api/renders/{id}/feedback returns 403 for another users render', async ({ request }) => {
    const renderId = await createRender(td.userToken, td.userId);

    const res = await request.post(`${BASE_URL}/api/renders/${renderId}/feedback`, {
      headers: authHeaders(td.designerToken),
      data: { rating: 3 },
    });
    expect(res.status()).toBe(403);
  });

  test('GET /api/renders/{id}/feedback returns 403 for another users render', async ({ request }) => {
    const renderId = await createRender(td.userToken, td.userId);
    // Submit feedback first so there is data to read
    await request.post(`${BASE_URL}/api/renders/${renderId}/feedback`, {
      headers: authHeaders(td.userToken),
      data: { rating: 4 },
    });

    const res = await request.get(`${BASE_URL}/api/renders/${renderId}/feedback`, {
      headers: authHeaders(td.designerToken),
    });
    expect(res.status()).toBe(403);
  });

  // ── 5. Cross-user notification isolation ─────────────────────────────────────

  test('marking another users notification as read updates 0 records', async ({ request }) => {
    const notifId = await seedNotification(td.userId);

    const res = await request.post(`${BASE_URL}/api/notifications/read`, {
      headers: authHeaders(td.designerToken),
      data: { notificationIds: [notifId] },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.updatedCount).toBe(0);
  });

  // ── 6. Input validation — feedback ────────────────────────────────────────────

  test('feedback rating below 1 returns 400 with rating error', async ({ request }) => {
    const renderId = await createRender(td.userToken, td.userId);
    const res = await request.post(`${BASE_URL}/api/renders/${renderId}/feedback`, {
      headers: authHeaders(td.userToken),
      data: { rating: 0 },
    });
    expect(res.status()).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  test('feedback rating above 5 returns 400', async ({ request }) => {
    const renderId = await createRender(td.userToken, td.userId);
    const res = await request.post(`${BASE_URL}/api/renders/${renderId}/feedback`, {
      headers: authHeaders(td.userToken),
      data: { rating: 6 },
    });
    expect(res.status()).toBe(400);
  });

  test('non-numeric feedback rating returns 400', async ({ request }) => {
    const renderId = await createRender(td.userToken, td.userId);
    const res = await request.post(`${BASE_URL}/api/renders/${renderId}/feedback`, {
      headers: authHeaders(td.userToken),
      data: { rating: 'excellent' },
    });
    expect(res.status()).toBe(400);
  });

  // ── 7. XSS/injection in feedback comment is stored as plain text ──────────────
  test('XSS payload in feedbackComment is stored verbatim (no execution context)', async ({ request }) => {
    const renderId = await createRender(td.userToken, td.userId);
    const xssPayload = '<script>alert("xss")</script>';

    await request.post(`${BASE_URL}/api/renders/${renderId}/feedback`, {
      headers: authHeaders(td.userToken),
      data: { rating: 3, feedbackComment: xssPayload },
    });

    const getRes = await request.get(`${BASE_URL}/api/renders/${renderId}/feedback`, {
      headers: authHeaders(td.userToken),
    });
    const data = await getRes.json();
    // Comment is stored as-is (MongoDB string), no HTML execution context in the JSON API
    expect(typeof data.feedbackComment).toBe('string');
    // The comment is returned as the raw string (no HTML stripping required at API level)
    expect(data.feedbackComment).toBe(xssPayload.slice(0, 500));
  });

  // ── 8. Feedback comment length enforced ───────────────────────────────────────
  test('feedbackComment longer than 500 chars is truncated to 500', async ({ request }) => {
    const renderId = await createRender(td.userToken, td.userId);

    await request.post(`${BASE_URL}/api/renders/${renderId}/feedback`, {
      headers: authHeaders(td.userToken),
      data: { rating: 3, feedbackComment: 'B'.repeat(600) },
    });

    const getRes = await request.get(`${BASE_URL}/api/renders/${renderId}/feedback`, {
      headers: authHeaders(td.userToken),
    });
    const data = await getRes.json();
    expect(data.feedbackComment.length).toBeLessThanOrEqual(500);
  });

  // ── 9. Notification read endpoint body validation ─────────────────────────────
  test('POST /api/notifications/read with empty body returns 400', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/notifications/read`, {
      headers: authHeaders(td.userToken),
      data: {},
    });
    expect(res.status()).toBe(400);
  });

  test('POST /api/notifications/read with invalid JSON returns 400', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/notifications/read`, {
      headers: {
        Cookie: `auth_token=${td.userToken}`,
        'Content-Type': 'application/json',
      },
      data: 'not-json' as any,
    });
    // 400 from body parse error or invalid body
    expect([400, 500]).toContain(res.status());
  });

  // ── 10. ObjectId injection via path param ─────────────────────────────────────
  test('invalid notification ID in path returns 400', async ({ request }) => {
    const res = await request.delete(`${BASE_URL}/api/notifications/not-a-valid-id`, {
      headers: authHeaders(td.userToken),
    });
    expect(res.status()).toBe(400);
  });

  test('invalid render ID in feedback path returns 404 or 500', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/renders/not-a-mongo-id/feedback`, {
      headers: authHeaders(td.userToken),
      data: { rating: 3 },
    });
    // Mongoose findById with invalid ID throws CastError → 500, or route may return 404
    expect([400, 404, 500]).toContain(res.status());
  });
});
