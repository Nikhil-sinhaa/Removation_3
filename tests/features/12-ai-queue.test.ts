import { test, expect } from '@playwright/test';
import { BASE_URL, setupTestData, authHeaders, TEST_SECRET, type TestData } from '../setup/testHelpers';

let td: TestData;

const COMFY = process.env.COMFYUI_AVAILABLE === 'true';

const queueHelperHeaders = { 'x-test-secret': TEST_SECRET, 'Content-Type': 'application/json' };

async function seedQueue(): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/test/queue/seed`, {
    method: 'POST',
    headers: queueHelperHeaders,
  });
  if (!res.ok) throw new Error(`queue/seed failed (${res.status}): ${await res.text()}`);
}

async function flushQueue(): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/test/queue/flush`, {
    method: 'POST',
    headers: queueHelperHeaders,
  });
  if (!res.ok) throw new Error(`queue/flush failed (${res.status}): ${await res.text()}`);
}

/** Creates a Render document with a jobId to make the queue route find it. */
async function createTrackedRender(token: string, userId: string): Promise<{ renderId: string; jobId: string }> {
  const jobId = `test_job_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const res = await fetch(`${BASE_URL}/api/renders`, {
    method: 'POST',
    headers: { ...authHeaders(token) },
    body: JSON.stringify({
      inputImage:  'queue-tracking',
      mode:        'redesign',
      userId,
      clerkId:     userId,
      status:      'queued',
      featureType: 'room-changer',
      jobId,
      jobStatus:   'queued',
      queuedAt:    new Date().toISOString(),
    }),
  });
  if (!res.ok) throw new Error(`createTrackedRender failed (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return { renderId: data._id ?? data.id, jobId };
}

test.describe('Feature 12: AI Queue', () => {
  test.beforeAll(async ({ request }) => {
    td = await setupTestData(request);
  });

  test.afterAll(async ({ request }) => {
    await flushQueue().catch(() => {});
    await request.post(`${BASE_URL}/api/test/cleanup`, {
      headers: { 'x-test-secret': TEST_SECRET },
    });
  });

  // ── Test 1: Auth required ──────────────────────────────────────────────────────
  test('GET /api/ai/queue without auth returns 401', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/ai/queue?jobId=test123`);
    expect(res.status()).toBe(401);
  });

  test('DELETE /api/ai/queue without auth returns 401', async ({ request }) => {
    const res = await request.delete(`${BASE_URL}/api/ai/queue?jobId=test123`);
    expect(res.status()).toBe(401);
  });

  // ── Test 2: Missing jobId parameter ───────────────────────────────────────────
  test('GET /api/ai/queue without jobId returns 400', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/ai/queue`, {
      headers: authHeaders(td.userToken),
    });
    expect(res.status()).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/jobId/i);
  });

  test('DELETE /api/ai/queue without jobId returns 400', async ({ request }) => {
    const res = await request.delete(`${BASE_URL}/api/ai/queue`, {
      headers: authHeaders(td.userToken),
    });
    expect(res.status()).toBe(400);
  });

  // ── Test 3: Non-existent jobId ────────────────────────────────────────────────
  test('GET /api/ai/queue with non-existent jobId returns 404', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/ai/queue?jobId=does_not_exist_xyz`, {
      headers: authHeaders(td.userToken),
    });
    expect(res.status()).toBe(404);
  });

  // ── Test 4: Valid jobId — status shape ────────────────────────────────────────
  test('GET /api/ai/queue returns correct shape for a tracked render', async ({ request }) => {
    const { jobId } = await createTrackedRender(td.userToken, td.userId);

    const res = await request.get(`${BASE_URL}/api/ai/queue?jobId=${jobId}`, {
      headers: authHeaders(td.userToken),
    });
    expect(res.status(), `body: ${await res.text()}`).toBe(200);
    const data = await res.json();

    expect(data).toHaveProperty('jobId', jobId);
    expect(data).toHaveProperty('renderId');
    expect(data).toHaveProperty('jobStatus');
    expect(data).toHaveProperty('featureType');
    expect(data).toHaveProperty('queueDepth');
    expect(typeof data.queueDepth).toBe('number');
  });

  // ── Test 5: Ownership — another user's job is 403 ─────────────────────────────
  test('GET /api/ai/queue for another users job returns 403', async ({ request }) => {
    const { jobId } = await createTrackedRender(td.userToken, td.userId);

    // Admin tries to read user's job
    const res = await request.get(`${BASE_URL}/api/ai/queue?jobId=${jobId}`, {
      headers: authHeaders(td.adminToken),
    });
    expect(res.status()).toBe(403);
  });

  test('DELETE /api/ai/queue for another users job returns 403', async ({ request }) => {
    const { jobId } = await createTrackedRender(td.userToken, td.userId);

    const res = await request.delete(`${BASE_URL}/api/ai/queue?jobId=${jobId}`, {
      headers: authHeaders(td.adminToken),
    });
    expect(res.status()).toBe(403);
  });

  // ── Test 6: Cancel a queued job ────────────────────────────────────────────────
  test('DELETE /api/ai/queue cancels a job or reports it is already processing', async ({ request }) => {
    const { jobId } = await createTrackedRender(td.userToken, td.userId);

    const res = await request.delete(`${BASE_URL}/api/ai/queue?jobId=${jobId}`, {
      headers: authHeaders(td.userToken),
    });
    // 200 = cancelled from queue; 409 = already picked up by worker
    expect([200, 409]).toContain(res.status());
    const data = await res.json();
    if (res.status() === 200) {
      expect(data.success).toBe(true);
    } else {
      expect(data.success).toBe(false);
    }
  });

  // ── Test 7: Admin GET /api/admin/queue — stats shape ─────────────────────────
  test('GET /api/admin/queue returns stats shape for admin', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/admin/queue`, {
      headers: authHeaders(td.adminToken),
    });
    expect(res.status(), `body: ${await res.text()}`).toBe(200);
    const data = await res.json();

    expect(data).toHaveProperty('stats');
    expect(data.stats).toHaveProperty('queueDepth');
    expect(data.stats).toHaveProperty('totalQueued');
    expect(data.stats).toHaveProperty('totalCompleted');
    expect(data.stats).toHaveProperty('totalFailed');
    expect(data).toHaveProperty('queuedJobs');
    expect(Array.isArray(data.queuedJobs)).toBe(true);
    expect(data).toHaveProperty('recentJobs');
    expect(Array.isArray(data.recentJobs)).toBe(true);
    expect(data).toHaveProperty('registrySize');
  });

  test('GET /api/admin/queue returns 403 for regular user', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/admin/queue`, {
      headers: authHeaders(td.userToken),
    });
    expect(res.status()).toBe(403);
  });

  // ── Test 8: Admin POST flush_stuck_lock ───────────────────────────────────────
  test('POST /api/admin/queue with flush_stuck_lock returns success', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/admin/queue`, {
      headers: authHeaders(td.adminToken),
      data: { action: 'flush_stuck_lock' },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  // ── Test 9: Queue full returns 503 Service Unavailable ───────────────────────
  test('should return 500 with queue-full message when queue depth >= 10', async ({ request }) => {
    if (!COMFY) {
      // Even without COMFY we can test the queue cap — the error fires before ComfyUI
    }

    await seedQueue();

    try {
      // Use multipart/form-data via the global FormData (Node 18+)
      const formData = new FormData();
      formData.append('colorName', 'sky blue');
      formData.append('hex', '#87CEEB');
      // Provide a minimal fake image — queue cap check fires during enqueueGeneration
      // which runs after image saving; a 1-byte blob is enough to pass file validation
      const fakeImg = new Blob(['fake'], { type: 'image/png' });
      formData.append('roomImage', fakeImg, 'room.png');

      const res = await fetch(`${BASE_URL}/api/ai/room-changer/generate`, {
        method: 'POST',
        headers: { Cookie: `auth_token=${td.userToken}` },
        body: formData,
      });

      // With 10 items in the queue, enqueueGeneration throws with code='QUEUE_FULL'
      // Routes detect the code and return 503 Service Unavailable.
      expect(res.status).toBe(503);
      const data = await res.json();
      const msg = (data.error ?? data.message ?? '').toLowerCase();
      expect(msg).toContain('queue');
    } finally {
      await flushQueue();
    }
  });

  // ── Test 10: Admin clear_queue marks queued renders failed ────────────────────
  test('POST /api/admin/queue clear_queue marks queued renders as failed', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/admin/queue`, {
      headers: authHeaders(td.adminToken),
      data: { action: 'clear_queue' },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(typeof data.cancelledCount).toBe('number');
    expect(typeof data.rendersMarkedFailed).toBe('number');
  });
});
