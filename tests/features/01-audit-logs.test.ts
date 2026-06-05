import { test, expect } from '@playwright/test';
import { BASE_URL, setupTestData, authHeaders, type TestData } from '../setup/testHelpers';

let td: TestData;

test.describe('Feature 1: Audit Logs', () => {
  test.beforeAll(async ({ request }) => {
    td = await setupTestData(request);
  });

  test('GET /api/admin/audit-logs requires authentication', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/admin/audit-logs`);
    expect(res.status()).toBe(401);
  });

  test('GET /api/admin/audit-logs returns logs and pagination for admin', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/admin/audit-logs`, {
      headers: authHeaders(td.adminToken),
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('logs');
    expect(data).toHaveProperty('total');
    expect(data).toHaveProperty('page');
    expect(data).toHaveProperty('totalPages');
    expect(data).toHaveProperty('stats');
    expect(Array.isArray(data.logs)).toBe(true);
  });

  test('regular user is forbidden from audit logs', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/admin/audit-logs`, {
      headers: authHeaders(td.userToken),
    });
    expect(res.status()).toBe(403);
  });

  test('banning a user creates an audit log entry', async ({ request }) => {
    // Ban the test user
    const banRes = await request.patch(
      `${BASE_URL}/api/admin/users/${td.userId}/status`,
      {
        headers: authHeaders(td.adminToken),
        data:    { status: 'banned' },
      }
    );
    expect(banRes.status()).toBe(200);

    // Check audit log was created
    const logRes = await request.get(
      `${BASE_URL}/api/admin/audit-logs?action=user.ban&targetId=${td.userId}`,
      { headers: authHeaders(td.adminToken) }
    );
    expect(logRes.status()).toBe(200);
    const logData = await logRes.json();
    expect(logData.logs.length).toBeGreaterThan(0);
    expect(logData.logs[0].action).toBe('user.ban');
    expect(logData.logs[0].targetId).toBe(td.userId);

    // Restore for cleanup
    await request.patch(
      `${BASE_URL}/api/admin/users/${td.userId}/status`,
      {
        headers: authHeaders(td.adminToken),
        data:    { status: 'active' },
      }
    );
  });

  test('audit logs filter by category works', async ({ request }) => {
    const res = await request.get(
      `${BASE_URL}/api/admin/audit-logs?category=users`,
      { headers: authHeaders(td.adminToken) }
    );
    expect(res.status()).toBe(200);
    const data = await res.json();
    // Every returned log should be in the users category
    for (const log of data.logs as Array<{ category: string }>) {
      expect(log.category).toBe('users');
    }
  });

  test('audit logs filter by action works', async ({ request }) => {
    const res = await request.get(
      `${BASE_URL}/api/admin/audit-logs?action=user.ban`,
      { headers: authHeaders(td.adminToken) }
    );
    expect(res.status()).toBe(200);
    const data = await res.json();
    for (const log of data.logs as Array<{ action: string }>) {
      expect(log.action).toBe('user.ban');
    }
  });

  test('audit logs pagination params are respected', async ({ request }) => {
    const res = await request.get(
      `${BASE_URL}/api/admin/audit-logs?page=1&limit=5`,
      { headers: authHeaders(td.adminToken) }
    );
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.page).toBe(1);
    expect(data.limit).toBe(5);
    expect(data.logs.length).toBeLessThanOrEqual(5);
  });

  test('GET /api/admin/audit-logs/export returns CSV', async ({ request }) => {
    const res = await request.get(
      `${BASE_URL}/api/admin/audit-logs/export`,
      { headers: authHeaders(td.adminToken) }
    );
    expect(res.status()).toBe(200);
    const contentType = res.headers()['content-type'] || '';
    expect(contentType.toLowerCase()).toContain('text/csv');
    const body = await res.text();
    // CSV header row must be present
    expect(body).toContain('Timestamp');
    expect(body).toContain('Admin Email');
  });

  test('audit log stats include today count', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/admin/audit-logs`, {
      headers: authHeaders(td.adminToken),
    });
    const data = await res.json();
    expect(data.stats).toHaveProperty('total');
    expect(data.stats).toHaveProperty('today');
    expect(typeof data.stats.total).toBe('number');
    expect(typeof data.stats.today).toBe('number');
  });
});
