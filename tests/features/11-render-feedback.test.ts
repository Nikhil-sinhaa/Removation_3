import { test, expect } from '@playwright/test';
import { BASE_URL, setupTestData, authHeaders, TEST_SECRET, type TestData } from '../setup/testHelpers';
import { FEEDBACK_TAGS } from '../../lib/db/models/Render';

let td: TestData;

/** Creates a minimal Render document via POST /api/renders and returns its id. */
async function createTestRender(token: string, userId: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/renders`, {
    method: 'POST',
    headers: { ...authHeaders(token) },
    body: JSON.stringify({
      inputImage: 'test.jpg',
      mode:       'redesign',
      userId,
      clerkId:    userId,
      status:     'completed',
    }),
  });
  if (!res.ok) throw new Error(`createTestRender failed (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return data._id ?? data.id;
}

test.describe('Feature 11: Render Feedback', () => {
  test.beforeAll(async ({ request }) => {
    td = await setupTestData(request);
  });

  test.afterAll(async ({ request }) => {
    await request.post(`${BASE_URL}/api/test/cleanup`, {
      headers: { 'x-test-secret': TEST_SECRET },
    });
  });

  // ── Test 1: Submit 5-star feedback ────────────────────────────────────────────
  test('should accept 5-star feedback and persist it', async ({ request }) => {
    const renderId = await createTestRender(td.userToken, td.userId);

    const postRes = await request.post(`${BASE_URL}/api/renders/${renderId}/feedback`, {
      headers: authHeaders(td.userToken),
      data: { rating: 5, feedbackTags: ['great_quality', 'loved_it'] },
    });
    expect(postRes.status(), `body: ${await postRes.text()}`).toBe(200);
    const postData = await postRes.json();
    expect(postData.success).toBe(true);

    const getRes = await request.get(`${BASE_URL}/api/renders/${renderId}/feedback`, {
      headers: authHeaders(td.userToken),
    });
    expect(getRes.status()).toBe(200);
    const getData = await getRes.json();
    expect(getData.rating).toBe(5);
    expect(getData.feedbackTags).toContain('great_quality');
    expect(getData.feedbackTags).toContain('loved_it');
    expect(getData.feedbackSubmittedAt).not.toBeNull();
  });

  // ── Test 2: 1-star feedback with comment ─────────────────────────────────────
  test('should accept 1-star feedback with comment and persist feedbackSubmittedAt', async ({ request }) => {
    const renderId = await createTestRender(td.userToken, td.userId);

    const postRes = await request.post(`${BASE_URL}/api/renders/${renderId}/feedback`, {
      headers: authHeaders(td.userToken),
      data: {
        rating:          1,
        feedbackTags:    ['blurry', 'wrong_style'],
        feedbackComment: 'The style was completely off',
      },
    });
    expect(postRes.status()).toBe(200);

    const getRes = await request.get(`${BASE_URL}/api/renders/${renderId}/feedback`, {
      headers: authHeaders(td.userToken),
    });
    const getData = await getRes.json();
    expect(getData.rating).toBe(1);
    expect(getData.feedbackTags).toContain('blurry');
    expect(getData.feedbackTags).toContain('wrong_style');
    expect(getData.feedbackComment).toBe('The style was completely off');
    expect(getData.feedbackSubmittedAt).not.toBeNull();
  });

  // ── Test 3: Invalid ratings rejected ─────────────────────────────────────────
  test('should return 400 for rating below 1', async ({ request }) => {
    const renderId = await createTestRender(td.userToken, td.userId);
    const res = await request.post(`${BASE_URL}/api/renders/${renderId}/feedback`, {
      headers: authHeaders(td.userToken),
      data: { rating: 0 },
    });
    expect(res.status()).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/rating/i);
  });

  test('should return 400 for rating above 5', async ({ request }) => {
    const renderId = await createTestRender(td.userToken, td.userId);
    const res = await request.post(`${BASE_URL}/api/renders/${renderId}/feedback`, {
      headers: authHeaders(td.userToken),
      data: { rating: 6 },
    });
    expect(res.status()).toBe(400);
  });

  test('should return 400 for non-numeric rating', async ({ request }) => {
    const renderId = await createTestRender(td.userToken, td.userId);
    const res = await request.post(`${BASE_URL}/api/renders/${renderId}/feedback`, {
      headers: authHeaders(td.userToken),
      data: { rating: 'five' },
    });
    expect(res.status()).toBe(400);
  });

  // ── Test 4: Unknown tags are silently stripped ────────────────────────────────
  test('should strip invalid feedback tags and keep only valid FEEDBACK_TAGS', async ({ request }) => {
    const renderId = await createTestRender(td.userToken, td.userId);

    const res = await request.post(`${BASE_URL}/api/renders/${renderId}/feedback`, {
      headers: authHeaders(td.userToken),
      data: {
        rating:       4,
        feedbackTags: ['great_quality', 'not_a_real_tag', 'another_fake'],
      },
    });
    expect(res.status()).toBe(200);

    const getRes = await request.get(`${BASE_URL}/api/renders/${renderId}/feedback`, {
      headers: authHeaders(td.userToken),
    });
    const getData = await getRes.json();
    // Only the valid tag survives
    expect(getData.feedbackTags).toContain('great_quality');
    for (const tag of getData.feedbackTags as string[]) {
      expect((FEEDBACK_TAGS as readonly string[]).includes(tag)).toBe(true);
    }
  });

  // ── Test 5: Comment trimmed to 500 chars ─────────────────────────────────────
  test('should truncate feedbackComment to 500 characters', async ({ request }) => {
    const renderId = await createTestRender(td.userToken, td.userId);
    const longComment = 'A'.repeat(600);

    await request.post(`${BASE_URL}/api/renders/${renderId}/feedback`, {
      headers: authHeaders(td.userToken),
      data: { rating: 3, feedbackComment: longComment },
    });

    const getRes = await request.get(`${BASE_URL}/api/renders/${renderId}/feedback`, {
      headers: authHeaders(td.userToken),
    });
    const getData = await getRes.json();
    expect(getData.feedbackComment.length).toBeLessThanOrEqual(500);
  });

  // ── Test 6: Cross-user feedback access denied ─────────────────────────────────
  test('should return 403 when another user tries to submit feedback', async ({ request }) => {
    const renderId = await createTestRender(td.userToken, td.userId);

    const res = await request.post(`${BASE_URL}/api/renders/${renderId}/feedback`, {
      headers: authHeaders(td.adminToken),
      data: { rating: 3 },
    });
    expect(res.status()).toBe(403);
  });

  test('should return 403 when another user tries to GET feedback', async ({ request }) => {
    const renderId = await createTestRender(td.userToken, td.userId);
    await request.post(`${BASE_URL}/api/renders/${renderId}/feedback`, {
      headers: authHeaders(td.userToken),
      data: { rating: 5 },
    });

    const res = await request.get(`${BASE_URL}/api/renders/${renderId}/feedback`, {
      headers: authHeaders(td.adminToken),
    });
    expect(res.status()).toBe(403);
  });

  // ── Test 7: 404 for non-existent render ───────────────────────────────────────
  test('should return 404 for a non-existent render ID', async ({ request }) => {
    const fakeId = '64a0000000000000000aaaaa';
    const res = await request.post(`${BASE_URL}/api/renders/${fakeId}/feedback`, {
      headers: authHeaders(td.userToken),
      data: { rating: 3 },
    });
    expect(res.status()).toBe(404);
  });

  // ── Test 8: Unauthenticated access ────────────────────────────────────────────
  test('POST /api/renders/{id}/feedback without auth returns 401', async ({ request }) => {
    const renderId = await createTestRender(td.userToken, td.userId);
    const res = await request.post(`${BASE_URL}/api/renders/${renderId}/feedback`, {
      data: { rating: 4 },
    });
    expect(res.status()).toBe(401);
  });

  // ── Test 9: Admin feedback stats endpoint ────────────────────────────────────
  test('GET /api/admin/feedback/stats returns correct shape for admin', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/admin/feedback/stats`, {
      headers: authHeaders(td.adminToken),
    });
    expect(res.status(), `body: ${await res.text()}`).toBe(200);
    const data = await res.json();

    expect(data).toHaveProperty('overall');
    expect(data.overall).toHaveProperty('totalRatings');
    expect(data.overall).toHaveProperty('totalRenders');
    expect(data.overall).toHaveProperty('averageRating');
    expect(data.overall).toHaveProperty('ratingDistribution');
    expect(data.overall.ratingDistribution).toHaveProperty('1');
    expect(data.overall.ratingDistribution).toHaveProperty('5');

    expect(data).toHaveProperty('byFeature');
    expect(Array.isArray(data.byFeature)).toBe(true);

    expect(data).toHaveProperty('topTags');
    expect(Array.isArray(data.topTags)).toBe(true);

    expect(data).toHaveProperty('recentLowRated');
    expect(Array.isArray(data.recentLowRated)).toBe(true);

    expect(data).toHaveProperty('weeklyTrend');
    expect(Array.isArray(data.weeklyTrend)).toBe(true);
  });

  test('GET /api/admin/feedback/stats returns 403 for regular user', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/admin/feedback/stats`, {
      headers: authHeaders(td.userToken),
    });
    expect(res.status()).toBe(403);
  });

  // ── Test 10: Low-rated render appears in recentLowRated ───────────────────────
  test('1-star render should appear in admin recentLowRated list', async ({ request }) => {
    const renderId = await createTestRender(td.userToken, td.userId);
    await request.post(`${BASE_URL}/api/renders/${renderId}/feedback`, {
      headers: authHeaders(td.userToken),
      data: { rating: 1, feedbackTags: ['blurry'], feedbackComment: 'Terrible quality' },
    });

    const statsRes = await request.get(`${BASE_URL}/api/admin/feedback/stats`, {
      headers: authHeaders(td.adminToken),
    });
    const stats = await statsRes.json();
    const found = stats.recentLowRated.find((r: { _id: string }) => r._id === renderId);
    expect(found).toBeDefined();
    expect(found.rating).toBe(1);
    expect(found.feedbackTags).toContain('blurry');
  });
});
