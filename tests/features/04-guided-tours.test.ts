import { test, expect } from '@playwright/test';
import { BASE_URL, setupTestData, authHeaders, type TestData } from '../setup/testHelpers';

let td: TestData;

test.describe('Feature 4: Guided Tours', () => {
  test.beforeAll(async ({ request }) => {
    td = await setupTestData(request);
  });

  test('GET /api/tours requires auth', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/tours?pathname=/dashboard`);
    expect(res.status()).toBe(401);
  });

  test('GET /api/tours without pathname returns 400', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/tours`, {
      headers: authHeaders(td.userToken),
    });
    expect(res.status()).toBe(400);
  });

  test('GET /api/tours?pathname=/dashboard returns pending tour or null', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/tours?pathname=/dashboard`, {
      headers: authHeaders(td.userToken),
    });
    expect(res.status()).toBe(200);
    // Returns either { tour: {...} } or { tour: null }
    const data = await res.json();
    expect(data).toHaveProperty('tour');
  });

  test('POST /api/tours/dashboard-intro/progress records start', async ({ request }) => {
    // Reset the tour first
    await request.post(
      `${BASE_URL}/api/tours/dashboard-intro/progress`,
      {
        headers: authHeaders(td.userToken),
        data:    { action: 'reset', step: 0 },
      }
    );

    const res = await request.post(
      `${BASE_URL}/api/tours/dashboard-intro/progress`,
      {
        headers: authHeaders(td.userToken),
        data:    { action: 'next', step: 0 },
      }
    );
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.progress).toBeTruthy();
  });

  test('POST /api/tours/dashboard-intro/progress advances step', async ({ request }) => {
    const res = await request.post(
      `${BASE_URL}/api/tours/dashboard-intro/progress`,
      {
        headers: authHeaders(td.userToken),
        data:    { action: 'next', step: 2 },
      }
    );
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.progress.currentStep).toBe(2);
  });

  test('POST /api/tours/dashboard-intro/progress completes the tour', async ({ request }) => {
    const res = await request.post(
      `${BASE_URL}/api/tours/dashboard-intro/progress`,
      {
        headers: authHeaders(td.userToken),
        data:    { action: 'complete' },
      }
    );
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.progress.isCompleted).toBe(true);
  });

  test('completed tour no longer shows as active for that page', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/tours?pathname=/dashboard`, {
      headers: authHeaders(td.userToken),
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    // dashboard-intro was just completed — tour should be null or a different one
    if (data.tour) {
      expect(data.tour.id).not.toBe('dashboard-intro');
    }
  });

  test('GET /api/tours/all returns all active tours', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/tours/all`, {
      headers: authHeaders(td.userToken),
    });
    expect(res.status()).toBe(200);
    const tours = await res.json();
    // Returns a plain array
    expect(Array.isArray(tours)).toBe(true);
    expect(tours.length).toBeGreaterThanOrEqual(3);
  });

  test('GET /api/tours/all marks completed tour correctly', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/tours/all`, {
      headers: authHeaders(td.userToken),
    });
    const tours = await res.json() as Array<{ id: string; isCompleted: boolean }>;
    const dashTour = tours.find(t => t.id === 'dashboard-intro');
    expect(dashTour).toBeTruthy();
    expect(dashTour!.isCompleted).toBe(true);
  });

  test('POST /api/tours/dream-room-intro/progress dismisses tour', async ({ request }) => {
    const res = await request.post(
      `${BASE_URL}/api/tours/dream-room-intro/progress`,
      {
        headers: authHeaders(td.userToken),
        data:    { action: 'dismiss' },
      }
    );
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.progress.isDismissed).toBe(true);
  });

  test('GET /api/admin/tours returns all tours with stats', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/admin/tours`, {
      headers: authHeaders(td.adminToken),
    });
    expect(res.status()).toBe(200);
    const tours = await res.json() as Array<{ id: string; stats: Record<string, number> }>;
    expect(Array.isArray(tours)).toBe(true);
    expect(tours.length).toBeGreaterThanOrEqual(3);
    // Each should have stats
    for (const tour of tours) {
      expect(tour.stats).toBeTruthy();
      expect(tour.stats).toHaveProperty('totalStarts');
      expect(tour.stats).toHaveProperty('completions');
    }
  });

  test('dashboard-intro shows completions >= 1 in admin stats', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/admin/tours`, {
      headers: authHeaders(td.adminToken),
    });
    const tours = await res.json() as Array<{ id: string; stats: { completions: number } }>;
    const dashTour = tours.find(t => t.id === 'dashboard-intro');
    expect(dashTour).toBeTruthy();
    expect(dashTour!.stats.completions).toBeGreaterThanOrEqual(1);
  });

  test('PATCH /api/admin/tours/[tourId] disables a tour', async ({ request }) => {
    const res = await request.patch(
      `${BASE_URL}/api/admin/tours/room-changer-intro`,
      {
        headers: authHeaders(td.adminToken),
        data:    { isActive: false },
      }
    );
    expect(res.status()).toBe(200);
    const tour = await res.json();
    expect(tour.isActive).toBe(false);

    // Re-enable
    await request.patch(
      `${BASE_URL}/api/admin/tours/room-changer-intro`,
      {
        headers: authHeaders(td.adminToken),
        data:    { isActive: true },
      }
    );
  });

  test('POST /api/tours/[tourId]/progress reset works', async ({ request }) => {
    const res = await request.post(
      `${BASE_URL}/api/tours/dashboard-intro/progress`,
      {
        headers: authHeaders(td.userToken),
        data:    { action: 'reset' },
      }
    );
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.progress.isCompleted).toBe(false);
    expect(data.progress.isDismissed).toBe(false);
    expect(data.progress.currentStep).toBe(0);
  });
});
