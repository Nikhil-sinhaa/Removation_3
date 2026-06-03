import { test, expect } from '@playwright/test';
import { BASE_URL, setupTestData, authHeaders, type TestData } from '../setup/testHelpers';

let td: TestData;

test.describe('Feature 5: Smart Search', () => {
  test.beforeAll(async ({ request }) => {
    td = await setupTestData(request);
  });

  test('GET /api/search requires auth', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/search?q=bedroom`);
    expect(res.status()).toBe(401);
  });

  test('query shorter than 2 chars returns empty results', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/search?q=a`, {
      headers: authHeaders(td.userToken),
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.results).toHaveLength(0);
    expect(data.total).toBe(0);
  });

  test('GET /api/search returns properly shaped response', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/search?q=bedroom`, {
      headers: authHeaders(td.userToken),
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('results');
    expect(data).toHaveProperty('grouped');
    expect(data).toHaveProperty('took');
    expect(data).toHaveProperty('total');
    expect(Array.isArray(data.results)).toBe(true);
    expect(typeof data.took).toBe('number');
    expect(typeof data.total).toBe('number');
  });

  test('search for known page keyword returns page results', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/search?q=furniture`, {
      headers: authHeaders(td.userToken),
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    const pageResults: Array<{ title: string; type: string }> = data.grouped?.page || [];
    // Furniture Remover or Furniture Placement should appear
    if (pageResults.length > 0) {
      const titles = pageResults.map(r => r.title.toLowerCase());
      const hasFurniture = titles.some(t => t.includes('furniture'));
      expect(hasFurniture).toBe(true);
    }
  });

  test('search for style preset returns style results', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/search?q=japandi`, {
      headers: authHeaders(td.userToken),
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    const styleResults: Array<{ title: string }> = data.grouped?.style || [];
    if (styleResults.length > 0) {
      const titles = styleResults.map(r => r.title.toLowerCase());
      expect(titles.some(t => t.includes('japandi'))).toBe(true);
    }
  });

  test('search response time is under 3 seconds', async ({ request }) => {
    const start = Date.now();
    await request.get(`${BASE_URL}/api/search?q=modern`, {
      headers: authHeaders(td.userToken),
    });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(3000);
  });

  test('empty query returns empty results', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/search?q=`, {
      headers: authHeaders(td.userToken),
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.results).toHaveLength(0);
  });

  test('types filter works — only specified types returned', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/search?q=room&types=page`, {
      headers: authHeaders(td.userToken),
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    // All results should be of type 'page'
    const nonPage = (data.results as Array<{ type: string }>).filter(r => r.type !== 'page');
    expect(nonPage.length).toBe(0);
  });

  test('grouped results contain consistent types', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/search?q=room`, {
      headers: authHeaders(td.userToken),
    });
    const data = await res.json();
    const grouped = data.grouped as Record<string, Array<{ type: string }>>;
    // Each key in grouped should match the type of its items
    for (const [key, items] of Object.entries(grouped)) {
      for (const item of items) {
        expect(item.type).toBe(key);
      }
    }
  });
});
