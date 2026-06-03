import { test, expect } from '@playwright/test';
import { BASE_URL, setupTestData, authHeaders, type TestData } from '../setup/testHelpers';

let td: TestData;

test.describe('Feature 3: Task Scheduler', () => {
  test.beforeAll(async ({ request }) => {
    td = await setupTestData(request);
  });

  test('GET /api/admin/scheduler requires admin role', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/admin/scheduler`);
    expect(res.status()).toBe(401);
  });

  test('GET /api/admin/scheduler returns tasks list with stats', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/admin/scheduler`, {
      headers: authHeaders(td.adminToken),
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('tasks');
    expect(data).toHaveProperty('stats');
    expect(Array.isArray(data.tasks)).toBe(true);
    expect(data.tasks.length).toBeGreaterThanOrEqual(7);
    expect(data.stats).toHaveProperty('total');
    expect(data.stats).toHaveProperty('enabled');
  });

  test('all expected task IDs are seeded', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/admin/scheduler`, {
      headers: authHeaders(td.adminToken),
    });
    const { tasks } = await res.json();
    const taskIds = (tasks as Array<{ taskId: string }>).map(t => t.taskId);

    const required = [
      'purge.old.renders',
      'purge.audit.logs',
      'subscription.expiry.check',
      'render.stuck.cleanup',
      'redis.cache.flush',
      'db.stats.snapshot',
    ];

    for (const id of required) {
      expect(taskIds, `Expected task ${id} to be seeded`).toContain(id);
    }
  });

  test('POST /api/cron/run/render.stuck.cleanup executes the task', async ({ request }) => {
    const res = await request.post(
      `${BASE_URL}/api/cron/run/render.stuck.cleanup`,
      { headers: authHeaders(td.adminToken) }
    );
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('message');
  });

  test('POST /api/cron/run/db.stats.snapshot executes the task', async ({ request }) => {
    const res = await request.post(
      `${BASE_URL}/api/cron/run/db.stats.snapshot`,
      { headers: authHeaders(td.adminToken) }
    );
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  test('PATCH /api/admin/scheduler/[taskId] disables a task', async ({ request }) => {
    const res = await request.patch(
      `${BASE_URL}/api/admin/scheduler/db.stats.snapshot`,
      {
        headers: authHeaders(td.adminToken),
        data:    { enabled: false },
      }
    );
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.task.enabled).toBe(false);
    expect(data.task.status).toBe('disabled');
  });

  test('PATCH /api/admin/scheduler/[taskId] re-enables a task', async ({ request }) => {
    const res = await request.patch(
      `${BASE_URL}/api/admin/scheduler/db.stats.snapshot`,
      {
        headers: authHeaders(td.adminToken),
        data:    { enabled: true },
      }
    );
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.task.enabled).toBe(true);
  });

  test('PATCH unknown taskId returns 404', async ({ request }) => {
    const res = await request.patch(
      `${BASE_URL}/api/admin/scheduler/nonexistent.task.xyz`,
      {
        headers: authHeaders(td.adminToken),
        data:    { enabled: false },
      }
    );
    expect(res.status()).toBe(404);
  });

  test('GET /api/cron/run without secret returns 401', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/cron/run`);
    expect(res.status()).toBe(401);
  });

  test('each task has required fields', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/admin/scheduler`, {
      headers: authHeaders(td.adminToken),
    });
    const { tasks } = await res.json();
    for (const task of tasks as Array<Record<string, unknown>>) {
      expect(task).toHaveProperty('taskId');
      expect(task).toHaveProperty('name');
      expect(task).toHaveProperty('cronExpression');
      expect(task).toHaveProperty('enabled');
      expect(task).toHaveProperty('status');
    }
  });
});
