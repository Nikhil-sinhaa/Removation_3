import { test, expect } from '@playwright/test';
import { BASE_URL, setupTestData, authHeaders, TEST_SECRET, type TestData } from '../setup/testHelpers';

let td: TestData;

const seedHeaders = { 'x-test-secret': TEST_SECRET, 'Content-Type': 'application/json' };

async function seedNotifications(
  userId: string,
  count = 2,
  type = 'system',
): Promise<{ notificationIds: string[] }> {
  const res = await fetch(`${BASE_URL}/api/test/notifications/seed`, {
    method: 'POST',
    headers: seedHeaders,
    body: JSON.stringify({ userId, count, type }),
  });
  if (!res.ok) throw new Error(`Notification seed failed (${res.status}): ${await res.text()}`);
  return res.json();
}

test.describe('Feature 10: Notification System', () => {
  test.beforeAll(async ({ request }) => {
    td = await setupTestData(request);
  });

  test.afterAll(async ({ request }) => {
    await request.post(`${BASE_URL}/api/test/cleanup`, {
      headers: { 'x-test-secret': TEST_SECRET },
    });
  });

  // ── Test 1: Empty state ────────────────────────────────────────────────────────
  test('GET /api/notifications returns 200 and correct shape', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/notifications`, {
      headers: authHeaders(td.userToken),
    });
    expect(res.status(), `body: ${await res.text()}`).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('notifications');
    expect(data).toHaveProperty('unreadCount');
    expect(Array.isArray(data.notifications)).toBe(true);
    // unreadCount must equal the number of unread notifications in the returned array
    const computedUnread = (data.notifications as Array<{ read: boolean }>).filter(n => !n.read).length;
    expect(data.unreadCount).toBe(computedUnread);
  });

  // ── Test 2: Notification created via indirect trigger ─────────────────────────
  test('should return created notification after booking is accepted', async ({ request }) => {
    // Accept triggers notifyBookingAccepted for the customer (td.userId)
    await request.post(`${BASE_URL}/api/bookings/${td.bookingId}/accept`, {
      headers: authHeaders(td.designerToken),
    });

    const res = await request.get(`${BASE_URL}/api/notifications`, {
      headers: authHeaders(td.userToken),
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.notifications.length).toBeGreaterThan(0);
    expect(data.unreadCount).toBeGreaterThanOrEqual(1);

    const notif = data.notifications[0];
    expect(notif).toHaveProperty('_id');
    expect(typeof notif._id).toBe('string');
    expect(notif).toHaveProperty('type');
    expect(notif).toHaveProperty('title');
    expect(notif).toHaveProperty('body');
    expect(notif).toHaveProperty('read');
    expect(notif).toHaveProperty('createdAt');
    expect(notif.read).toBe(false);
  });

  // ── Test 3: Mark single notification as read ──────────────────────────────────
  test('should mark only the specified notification as read', async ({ request }) => {
    const { notificationIds } = await seedNotifications(td.userId, 2);
    const [firstId, secondId] = notificationIds;

    const readRes = await request.post(`${BASE_URL}/api/notifications/read`, {
      headers: authHeaders(td.userToken),
      data: { notificationIds: [firstId] },
    });
    expect(readRes.status(), `body: ${await readRes.text()}`).toBe(200);
    const readData = await readRes.json();
    expect(readData.success).toBe(true);
    expect(readData.updatedCount).toBe(1);

    const listRes = await request.get(`${BASE_URL}/api/notifications`, {
      headers: authHeaders(td.userToken),
    });
    const listData = await listRes.json();
    const first  = listData.notifications.find((n: { _id: string }) => n._id === firstId);
    const second = listData.notifications.find((n: { _id: string }) => n._id === secondId);
    expect(first?.read).toBe(true);
    expect(second?.read).toBe(false);
    // unreadCount no longer includes firstId
    const unread = listData.notifications.filter((n: { read: boolean }) => !n.read).length;
    expect(listData.unreadCount).toBe(unread);
  });

  // ── Test 4: Mark all as read ───────────────────────────────────────────────────
  test('should mark all notifications as read with { all: true }', async ({ request }) => {
    await seedNotifications(td.userId, 2);

    const readRes = await request.post(`${BASE_URL}/api/notifications/read`, {
      headers: authHeaders(td.userToken),
      data: { all: true },
    });
    expect(readRes.status()).toBe(200);
    const readData = await readRes.json();
    expect(readData.success).toBe(true);

    const listRes = await request.get(`${BASE_URL}/api/notifications`, {
      headers: authHeaders(td.userToken),
    });
    const listData = await listRes.json();
    expect(listData.unreadCount).toBe(0);
    for (const n of listData.notifications as Array<{ read: boolean }>) {
      expect(n.read).toBe(true);
    }
  });

  // ── Test 5: Delete a notification ─────────────────────────────────────────────
  test('should delete a notification so it no longer appears in the list', async ({ request }) => {
    const { notificationIds } = await seedNotifications(td.userId, 1);
    const notifId = notificationIds[0];

    const delRes = await request.delete(`${BASE_URL}/api/notifications/${notifId}`, {
      headers: authHeaders(td.userToken),
    });
    expect(delRes.status(), `body: ${await delRes.text()}`).toBe(200);
    const delData = await delRes.json();
    expect(delData.success).toBe(true);

    const listRes = await request.get(`${BASE_URL}/api/notifications`, {
      headers: authHeaders(td.userToken),
    });
    const listData = await listRes.json();
    const found = listData.notifications.find((n: { _id: string }) => n._id === notifId);
    expect(found).toBeUndefined();
  });

  // ── Test 6: Cross-user mark-read returns updatedCount 0 ───────────────────────
  test('should return updatedCount 0 when trying to mark another users notification as read', async ({ request }) => {
    const { notificationIds } = await seedNotifications(td.userId, 1);
    const notifId = notificationIds[0];

    // Authenticated as adminToken (different userId) — updateMany is scoped to userId
    const readRes = await request.post(`${BASE_URL}/api/notifications/read`, {
      headers: authHeaders(td.adminToken),
      data: { notificationIds: [notifId] },
    });
    expect(readRes.status()).toBe(200);
    const data = await readRes.json();
    expect(data.updatedCount).toBe(0);
  });

  // ── Test 7: Cross-user delete is a silent no-op ───────────────────────────────
  // NOTE: DELETE /api/notifications/[id] uses findOneAndDelete({ _id, userId }).
  // When called by a different user, it silently returns null without error.
  // The route always responds { success: true } with 200 — this is intentional
  // (no information leak about notification existence).
  test('deleting another users notification returns 200 but notification still exists for owner', async ({ request }) => {
    const { notificationIds } = await seedNotifications(td.userId, 1);
    const notifId = notificationIds[0];

    // Admin tries to delete customer's notification — should be a no-op
    const delRes = await request.delete(`${BASE_URL}/api/notifications/${notifId}`, {
      headers: authHeaders(td.adminToken),
    });
    expect(delRes.status()).toBe(200);

    // Customer can still see their notification
    const listRes = await request.get(`${BASE_URL}/api/notifications`, {
      headers: authHeaders(td.userToken),
    });
    const listData = await listRes.json();
    const found = listData.notifications.find((n: { _id: string }) => n._id === notifId);
    expect(found).toBeDefined();
  });

  // ── Test 8: Unauthenticated access blocked ────────────────────────────────────
  test('GET /api/notifications without auth returns 401', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/notifications`);
    expect(res.status()).toBe(401);
  });

  test('POST /api/notifications/read without auth returns 401', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/notifications/read`, {
      data: { all: true },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /api/notifications/read with invalid body returns 400', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/notifications/read`, {
      headers: authHeaders(td.userToken),
      data: {},
    });
    expect(res.status()).toBe(400);
  });

  // ── Test 9: Notification bell UI shows unread badge ───────────────────────────
  test('notification bell shows unread badge after notification is seeded', async ({ page, context }) => {
    // Set auth cookie so the app layout loads in an authenticated state
    await context.addCookies([{
      name:   'auth_token',
      value:  td.userToken,
      domain: 'localhost',
      path:   '/',
    }]);

    // Seed one fresh unread notification
    await seedNotifications(td.userId, 1, 'system');

    // Navigate to a page that renders the (app) layout with the notification bell
    await page.goto(`${BASE_URL}/history`);

    // The bell button uses aria-label that includes "(N unread)" when there are unreads
    const bell = page.getByRole('button', { name: /Notifications/i });
    await expect(bell).toBeVisible({ timeout: 10_000 });

    // The aria-label changes to include "(N unread)" — look for the badge span
    const badge = page.locator('button[aria-label*="unread"] span');
    await expect(badge).toBeVisible({ timeout: 5_000 });
    const badgeText = await badge.textContent();
    expect(Number(badgeText?.replace('9+', '10'))).toBeGreaterThanOrEqual(1);
  });
});
