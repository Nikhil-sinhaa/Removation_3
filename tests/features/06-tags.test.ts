import { test, expect } from '@playwright/test';
import { BASE_URL, setupTestData, authHeaders, type TestData } from '../setup/testHelpers';

let td: TestData;
let createdTagId = '';

test.describe('Feature 6: Tags', () => {
  test.beforeAll(async ({ request }) => {
    td = await setupTestData(request);
  });

  test('GET /api/tags requires auth', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/tags`);
    expect(res.status()).toBe(401);
  });

  test('GET /api/tags returns seeded global tags', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/tags`, {
      headers: authHeaders(td.userToken),
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.tags)).toBe(true);
    expect(data.tags.length).toBeGreaterThanOrEqual(20);
    const labels = (data.tags as Array<{ label: string }>).map(t => t.label);
    expect(labels).toContain('Bedroom');
    expect(labels).toContain('Modern');
    expect(labels).toContain('In Progress');
  });

  test('GET /api/tags?q=bed filters by search term', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/tags?q=bed`, {
      headers: authHeaders(td.userToken),
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    for (const tag of data.tags as Array<{ label: string; slug: string }>) {
      const matchesLabel = tag.label.toLowerCase().includes('bed');
      const matchesSlug  = tag.slug.includes('bed');
      expect(matchesLabel || matchesSlug).toBe(true);
    }
  });

  test('GET /api/tags?category=room_type filters by category', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/tags?category=room_type`, {
      headers: authHeaders(td.userToken),
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.tags.length).toBeGreaterThan(0);
    for (const tag of data.tags as Array<{ category: string }>) {
      expect(tag.category).toBe('room_type');
    }
  });

  test('GET /api/tags?category=style returns style tags', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/tags?category=style`, {
      headers: authHeaders(td.userToken),
    });
    const data = await res.json();
    expect(data.tags.length).toBeGreaterThan(0);
    const labels = (data.tags as Array<{ label: string }>).map(t => t.label);
    expect(labels).toContain('Japandi');
  });

  test('POST /api/tags creates a new custom tag', async ({ request }) => {
    const uniqueLabel = `Test Tag ${Date.now()}`;
    const res = await request.post(`${BASE_URL}/api/tags`, {
      headers: authHeaders(td.userToken),
      data:    { label: uniqueLabel, category: 'custom', color: '#FF5733' },
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.tag.label).toBe(uniqueLabel);
    expect(data.tag.color).toBe('#FF5733');
    createdTagId = String(data.tag._id);
  });

  test('POST /api/tags without label returns 400', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/tags`, {
      headers: authHeaders(td.userToken),
      data:    { category: 'custom' },
    });
    expect(res.status()).toBe(400);
  });

  test('POST /api/projects/[id]/tags adds tag to project', async ({ request }) => {
    if (!td.projectId || !createdTagId) {
      test.skip();
      return;
    }
    const res = await request.post(
      `${BASE_URL}/api/projects/${td.projectId}/tags`,
      {
        headers: authHeaders(td.userToken),
        data:    { tagId: createdTagId },
      }
    );
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    const tagIds = (data.tags as Array<{ _id: string }>).map(t => String(t._id));
    expect(tagIds).toContain(createdTagId);
  });

  test('GET /api/projects/[id]/tags returns project tags', async ({ request }) => {
    if (!td.projectId) { test.skip(); return; }
    const res = await request.get(
      `${BASE_URL}/api/projects/${td.projectId}/tags`,
      { headers: authHeaders(td.userToken) }
    );
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.tags)).toBe(true);
  });

  test('DELETE /api/projects/[id]/tags removes tag from project', async ({ request }) => {
    if (!td.projectId || !createdTagId) { test.skip(); return; }
    const res = await request.delete(
      `${BASE_URL}/api/projects/${td.projectId}/tags`,
      {
        headers: authHeaders(td.userToken),
        data:    { tagId: createdTagId },
      }
    );
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    const tagIds = (data.tags as Array<{ _id: string }>).map(t => String(t._id));
    expect(tagIds).not.toContain(createdTagId);
  });

  test('GET /api/admin/tags returns global tag stats', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/admin/tags`, {
      headers: authHeaders(td.adminToken),
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('globalTags');
    expect(data).toHaveProperty('stats');
    expect(data.stats).toHaveProperty('totalTags');
    expect(data.stats).toHaveProperty('totalTaggings');
    expect(data.stats.totalTags).toBeGreaterThan(0);
  });

  test('DELETE /api/tags/[id] deletes custom tag', async ({ request }) => {
    if (!createdTagId) { test.skip(); return; }
    const res = await request.delete(
      `${BASE_URL}/api/tags/${createdTagId}`,
      { headers: authHeaders(td.userToken) }
    );
    expect(res.status()).toBe(200);
    expect((await res.json()).success).toBe(true);
  });

  test('each global tag has required fields', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/tags`, {
      headers: authHeaders(td.userToken),
    });
    const data = await res.json();
    for (const tag of data.tags as Array<Record<string, unknown>>) {
      expect(tag).toHaveProperty('label');
      expect(tag).toHaveProperty('slug');
      expect(tag).toHaveProperty('category');
      expect(tag).toHaveProperty('color');
    }
  });
});
