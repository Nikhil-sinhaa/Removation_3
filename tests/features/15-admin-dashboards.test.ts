import { test, expect } from '@playwright/test';
import { BASE_URL, setupTestData, authHeaders, TEST_SECRET, type TestData } from '../setup/testHelpers';

let td: TestData;

test.describe('Feature 15: Admin Dashboards', () => {
  test.beforeAll(async ({ request }) => {
    td = await setupTestData(request);
  });

  test.afterAll(async ({ request }) => {
    await request.post(`${BASE_URL}/api/test/cleanup`, {
      headers: { 'x-test-secret': TEST_SECRET },
    });
  });

  // ── Admin Stats ───────────────────────────────────────────────────────────────

  test('GET /api/admin/stats returns correct shape for admin', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/admin/stats`, {
      headers: authHeaders(td.adminToken),
    });
    expect(res.status(), `body: ${await res.text()}`).toBe(200);
    const data = await res.json();

    expect(data).toHaveProperty('users');
    expect(data.users).toHaveProperty('total');
    expect(data.users).toHaveProperty('today');
    expect(data.users).toHaveProperty('thisMonth');
    expect(data.users).toHaveProperty('growth');
    expect(data.users).toHaveProperty('pro');
    expect(data.users).toHaveProperty('byPlan');
    expect(data.users).toHaveProperty('byRole');
    expect(data.users).toHaveProperty('recent');
    expect(Array.isArray(data.users.recent)).toBe(true);

    expect(data).toHaveProperty('renders');
    expect(data.renders).toHaveProperty('total');
    expect(data.renders).toHaveProperty('today');
    expect(data.renders).toHaveProperty('byStatus');
    expect(data.renders).toHaveProperty('byMode');
    expect(Array.isArray(data.renders.byMode)).toBe(true);

    expect(typeof data.users.total).toBe('number');
    expect(data.users.total).toBeGreaterThan(0); // at least the test users exist
  });

  test('GET /api/admin/stats returns 403 for regular user', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/admin/stats`, {
      headers: authHeaders(td.userToken),
    });
    expect(res.status()).toBe(403);
  });

  test('GET /api/admin/stats returns 401 without auth', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/admin/stats`);
    expect(res.status()).toBe(401);
  });

  // ── Admin Analytics ───────────────────────────────────────────────────────────

  test('GET /api/admin/analytics returns correct shape for admin', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/admin/analytics`, {
      headers: authHeaders(td.adminToken),
    });
    expect(res.status(), `body: ${await res.text()}`).toBe(200);
    const data = await res.json();

    expect(data).toHaveProperty('metrics');
    expect(data.metrics).toHaveProperty('totalUsers');
    expect(data.metrics).toHaveProperty('activeUsers');
    expect(data.metrics).toHaveProperty('totalRenders');
    expect(data.metrics).toHaveProperty('revenue');

    expect(data).toHaveProperty('dailyRenders');
    expect(Array.isArray(data.dailyRenders)).toBe(true);

    expect(data).toHaveProperty('planDistribution');
    expect(Array.isArray(data.planDistribution)).toBe(true);

    expect(data).toHaveProperty('topStyles');
    expect(Array.isArray(data.topStyles)).toBe(true);

    expect(data).toHaveProperty('featureUsage');
    expect(Array.isArray(data.featureUsage)).toBe(true);

    expect(data).toHaveProperty('recentActivity');
    expect(Array.isArray(data.recentActivity)).toBe(true);
  });

  test('GET /api/admin/analytics?range=30d respects range parameter', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/admin/analytics?range=30d`, {
      headers: authHeaders(td.adminToken),
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    // 30d should produce up to 31 daily data points
    expect(Array.isArray(data.dailyRenders)).toBe(true);
    expect(data.dailyRenders.length).toBeLessThanOrEqual(31);
  });

  test('GET /api/admin/analytics returns 403 for regular user', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/admin/analytics`, {
      headers: authHeaders(td.userToken),
    });
    expect(res.status()).toBe(403);
  });

  // ── Admin Renders List ────────────────────────────────────────────────────────

  test('GET /api/admin/renders returns paginated list with stats', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/admin/renders?page=1&limit=10`, {
      headers: authHeaders(td.adminToken),
    });
    expect(res.status(), `body: ${await res.text()}`).toBe(200);
    const data = await res.json();

    expect(data).toHaveProperty('renders');
    expect(Array.isArray(data.renders)).toBe(true);
    expect(data).toHaveProperty('total');
    expect(data).toHaveProperty('page', 1);
    expect(data).toHaveProperty('limit', 10);
    expect(data).toHaveProperty('totalPages');
    expect(data.renders.length).toBeLessThanOrEqual(10);

    expect(data).toHaveProperty('stats');
    expect(data.stats).toHaveProperty('total');
    expect(data.stats).toHaveProperty('completed');
    expect(data.stats).toHaveProperty('failed');
    expect(data.stats).toHaveProperty('queued');
    expect(data.stats).toHaveProperty('successRate');
    expect(data.stats).toHaveProperty('avgProcessingTime');
  });

  test('GET /api/admin/renders filters by status', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/admin/renders?status=completed`, {
      headers: authHeaders(td.adminToken),
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    for (const render of data.renders as Array<{ status: string }>) {
      expect(render.status).toBe('completed');
    }
  });

  test('GET /api/admin/renders returns 403 for regular user', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/admin/renders`, {
      headers: authHeaders(td.userToken),
    });
    expect(res.status()).toBe(403);
  });

  // ── Admin Queue Status ────────────────────────────────────────────────────────

  test('GET /api/admin/queue returns queue stats for admin', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/admin/queue`, {
      headers: authHeaders(td.adminToken),
    });
    expect(res.status(), `body: ${await res.text()}`).toBe(200);
    const data = await res.json();

    expect(data).toHaveProperty('stats');
    expect(typeof data.stats.queueDepth).toBe('number');
    expect(typeof data.stats.totalQueued).toBe('number');
    expect(typeof data.stats.totalCompleted).toBe('number');
    expect(typeof data.stats.totalFailed).toBe('number');
    expect(data).toHaveProperty('queuedJobs');
    expect(data).toHaveProperty('recentJobs');
    expect(data).toHaveProperty('registrySize');
  });

  // ── Admin Feedback Stats ──────────────────────────────────────────────────────

  test('GET /api/admin/feedback/stats returns full stats shape for admin', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/admin/feedback/stats`, {
      headers: authHeaders(td.adminToken),
    });
    expect(res.status(), `body: ${await res.text()}`).toBe(200);
    const data = await res.json();

    // Overall
    expect(data.overall).toHaveProperty('totalRatings');
    expect(data.overall).toHaveProperty('totalRenders');
    expect(data.overall).toHaveProperty('averageRating');
    expect(data.overall.ratingDistribution).toHaveProperty('1');
    expect(data.overall.ratingDistribution).toHaveProperty('5');
    expect(typeof data.overall.totalRenders).toBe('number');

    // Arrays
    expect(Array.isArray(data.byFeature)).toBe(true);
    expect(Array.isArray(data.topTags)).toBe(true);
    expect(Array.isArray(data.recentLowRated)).toBe(true);
    expect(Array.isArray(data.weeklyTrend)).toBe(true);

    // topTags shape
    for (const tag of data.topTags as Array<{ tag: string; count: number; percent: number }>) {
      expect(typeof tag.tag).toBe('string');
      expect(typeof tag.count).toBe('number');
      expect(typeof tag.percent).toBe('number');
    }

    // weeklyTrend shape
    for (const entry of data.weeklyTrend as Array<{ week: string; avgRating: number; count: number }>) {
      expect(typeof entry.week).toBe('string');
      expect(entry.week).toMatch(/^\d{4}-W\d{2}$/);
    }
  });

  // ── Admin Scheduler ───────────────────────────────────────────────────────────

  test('GET /api/admin/scheduler returns tasks list with stats for admin', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/admin/scheduler`, {
      headers: authHeaders(td.adminToken),
    });
    expect(res.status(), `body: ${await res.text()}`).toBe(200);
    const data = await res.json();

    expect(data).toHaveProperty('tasks');
    expect(Array.isArray(data.tasks)).toBe(true);
    expect(data).toHaveProperty('stats');
    expect(typeof data.stats.total).toBe('number');
    expect(typeof data.stats.enabled).toBe('number');
    expect(typeof data.stats.disabled).toBe('number');
  });

  test('GET /api/admin/scheduler returns 403 for regular user', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/admin/scheduler`, {
      headers: authHeaders(td.userToken),
    });
    expect(res.status()).toBe(403);
  });
});
