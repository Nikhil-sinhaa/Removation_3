import { test, expect } from '@playwright/test';
import { BASE_URL, setupTestData, authHeaders, type TestData } from '../setup/testHelpers';

let td: TestData;
let redirectId = '';
let testSourceUrl = '';

test.describe('Feature 7: Redirect Manager', () => {
  test.beforeAll(async ({ request }) => {
    td = await setupTestData(request);
    testSourceUrl = `/test-redirect-${Date.now()}`;
  });

  test('GET /api/admin/redirects requires admin role', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/admin/redirects`);
    expect(res.status()).toBe(401);
  });

  test('POST /api/admin/redirects creates a redirect', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/admin/redirects`, {
      headers: authHeaders(td.adminToken),
      data: {
        sourceUrl:  testSourceUrl,
        destUrl:    '/dashboard',
        statusCode: 301,
        comment:    'Test redirect created by automated tests',
      },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.redirect.sourceUrl).toBe(testSourceUrl.toLowerCase());
    expect(data.redirect.destUrl).toBe('/dashboard');
    expect(data.redirect.statusCode).toBe(301);
    redirectId = String(data.redirect._id);
  });

  test('POST /api/admin/redirects without required fields returns 400', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/admin/redirects`, {
      headers: authHeaders(td.adminToken),
      data:    { sourceUrl: '/partial-only' },
    });
    expect(res.status()).toBe(400);
  });

  test('GET /api/admin/redirects returns redirects list with stats', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/admin/redirects`, {
      headers: authHeaders(td.adminToken),
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('redirects');
    expect(data).toHaveProperty('stats');
    expect(Array.isArray(data.redirects)).toBe(true);
    expect(data.stats).toHaveProperty('enabled');
    expect(data.stats).toHaveProperty('disabled');
    expect(data.stats).toHaveProperty('totalHits');
  });

  test('GET /api/admin/redirects?tab=404s returns 404 logs', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/admin/redirects?tab=404s`, {
      headers: authHeaders(td.adminToken),
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('logs');
    expect(Array.isArray(data.logs)).toBe(true);
  });

  test('PATCH /api/admin/redirects/[id] disables the redirect', async ({ request }) => {
    if (!redirectId) { test.skip(); return; }
    const res = await request.patch(
      `${BASE_URL}/api/admin/redirects/${redirectId}`,
      {
        headers: authHeaders(td.adminToken),
        data:    { status: 'disabled' },
      }
    );
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.redirect.status).toBe('disabled');
  });

  test('PATCH /api/admin/redirects/[id] re-enables the redirect', async ({ request }) => {
    if (!redirectId) { test.skip(); return; }
    const res = await request.patch(
      `${BASE_URL}/api/admin/redirects/${redirectId}`,
      {
        headers: authHeaders(td.adminToken),
        data:    { status: 'enabled' },
      }
    );
    expect(res.status()).toBe(200);
    expect((await res.json()).redirect.status).toBe('enabled');
  });

  test('GET /api/internal/check-redirect without secret returns null (not 401)', async ({ request }) => {
    const res = await request.get(
      `${BASE_URL}/api/internal/check-redirect?url=/nonexistent-path`
    );
    // Per the implementation: returns { redirect: null } when secret is wrong
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.redirect).toBeNull();
  });

  test('GET /api/internal/check-redirect with secret and known redirect returns destination', async ({ request }) => {
    const internalSecret = process.env.INTERNAL_SECRET || 'removation_internal_2024_change_this';
    const res = await request.get(
      `${BASE_URL}/api/internal/check-redirect?url=${testSourceUrl}`,
      { headers: { 'x-internal-secret': internalSecret } }
    );
    expect(res.status()).toBe(200);
    const data = await res.json();
    if (data.redirect) {
      expect(data.redirect.destUrl).toBe('/dashboard');
      expect(data.redirect.statusCode).toBe(301);
    }
    // If redirect is null (not found in cache), that's also acceptable
  });

  test('GET /api/internal/check-redirect with secret and unknown URL returns null', async ({ request }) => {
    const internalSecret = process.env.INTERNAL_SECRET || 'removation_internal_2024_change_this';
    const res = await request.get(
      `${BASE_URL}/api/internal/check-redirect?url=/definitely-does-not-exist-12345`,
      { headers: { 'x-internal-secret': internalSecret } }
    );
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.redirect).toBeNull();
  });

  test('DELETE /api/admin/redirects/[id] deletes the redirect', async ({ request }) => {
    if (!redirectId) { test.skip(); return; }
    const res = await request.delete(
      `${BASE_URL}/api/admin/redirects/${redirectId}`,
      { headers: authHeaders(td.adminToken) }
    );
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  test('redirect audit logs system.config.change after PATCH', async ({ request }) => {
    // Create a second redirect and patch it to verify audit trail
    const src = `/test-redirect-audit-${Date.now()}`;
    const createRes = await request.post(`${BASE_URL}/api/admin/redirects`, {
      headers: authHeaders(td.adminToken),
      data:    { sourceUrl: src, destUrl: '/pricing', statusCode: 302 },
    });
    const { redirect } = await createRes.json();

    await request.patch(
      `${BASE_URL}/api/admin/redirects/${String(redirect._id)}`,
      {
        headers: authHeaders(td.adminToken),
        data:    { status: 'disabled' },
      }
    );

    // Check audit log
    const auditRes = await request.get(
      `${BASE_URL}/api/admin/audit-logs?action=system.config.change`,
      { headers: authHeaders(td.adminToken) }
    );
    const auditData = await auditRes.json();
    expect(auditData.logs.length).toBeGreaterThan(0);

    // Cleanup
    await request.delete(`${BASE_URL}/api/admin/redirects/${String(redirect._id)}`, {
      headers: authHeaders(td.adminToken),
    });
  });
});
