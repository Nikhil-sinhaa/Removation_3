import { test, expect } from '@playwright/test';
import { BASE_URL, setupTestData, authHeaders, type TestData } from '../setup/testHelpers';

let td: TestData;

test.describe('Feature 2: Privacy & GDPR', () => {
  test.beforeAll(async ({ request }) => {
    td = await setupTestData(request);

    // Clean up any leftover delete requests from prior test runs
    await request.delete(`${BASE_URL}/api/user/delete-request`, {
      headers: authHeaders(td.userToken),
    });
  });

  test('POST /api/user/export requires auth', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/user/export`);
    expect(res.status()).toBe(401);
  });

  test('POST /api/user/export returns user data export', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/user/export`, {
      headers: authHeaders(td.userToken),
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('exportedAt');
  });

  test('export does not include password hash', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/user/export`, {
      headers: authHeaders(td.userToken),
    });
    const data = await res.json();
    const asString = JSON.stringify(data.data);
    // Must not expose bcrypt hash or password field at any level
    expect(asString).not.toContain('$2b$');
    expect(asString).not.toContain('"password"');
  });

  test('GET /api/user/export returns latest export request', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/user/export`, {
      headers: authHeaders(td.userToken),
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('request');
    // Should find the export we just created
    expect(data.request).not.toBeNull();
    expect(data.request.type).toBe('export');
    expect(data.request.status).toBe('completed');
  });

  test('POST /api/user/delete-request creates deletion request', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/user/delete-request`, {
      headers: authHeaders(td.userToken),
      data:    { reason: 'Testing deletion flow' },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.requestId).toBeTruthy();
  });

  test('duplicate deletion request returns 409', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/user/delete-request`, {
      headers: authHeaders(td.userToken),
      data:    { reason: 'Duplicate test' },
    });
    expect(res.status()).toBe(409);
  });

  test('GET /api/user/delete-request returns pending request', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/user/delete-request`, {
      headers: authHeaders(td.userToken),
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.request).not.toBeNull();
    expect(data.request.type).toBe('delete');
    expect(data.request.status).toBe('pending');
  });

  test('DELETE /api/user/delete-request cancels pending request', async ({ request }) => {
    const res = await request.delete(`${BASE_URL}/api/user/delete-request`, {
      headers: authHeaders(td.userToken),
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  test('after cancellation GET returns no pending request', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/user/delete-request`, {
      headers: authHeaders(td.userToken),
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.request).toBeNull();
  });

  test('GET /api/admin/privacy returns requests list', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/admin/privacy`, {
      headers: authHeaders(td.adminToken),
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('requests');
    expect(data).toHaveProperty('total');
    expect(data).toHaveProperty('pendingCount');
    expect(Array.isArray(data.requests)).toBe(true);
  });

  test('GET /api/admin/privacy?status=completed returns completed requests', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/admin/privacy?status=completed`, {
      headers: authHeaders(td.adminToken),
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    for (const req of data.requests as Array<{ status: string }>) {
      expect(req.status).toBe('completed');
    }
  });

  test('GET /api/admin/privacy?type=export returns only export requests', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/admin/privacy?type=export`, {
      headers: authHeaders(td.adminToken),
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    for (const req of data.requests as Array<{ type: string }>) {
      expect(req.type).toBe('export');
    }
  });
});
