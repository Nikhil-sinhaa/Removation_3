/**
 * Feature 14: Notification Triggers
 *
 * Verifies that booking workflow events (accept, reject, complete) fire the
 * correct notification types for the affected user.
 *
 * Tests 5-7 require ComfyUI (render pipeline) — they are skipped when COMFY is false.
 *
 * IMPORTANT: beforeEach calls setupTestData() to reset the booking to
 * pending_designer state before each test, since accept/reject change booking state.
 */

import { test, expect } from '@playwright/test';
import { BASE_URL, setupTestData, authHeaders, TEST_SECRET, type TestData } from '../setup/testHelpers';

let td: TestData;
const COMFY = process.env.COMFYUI_AVAILABLE === 'true';

async function getNotifications(token: string): Promise<{ notifications: any[]; unreadCount: number }> {
  const res = await fetch(`${BASE_URL}/api/notifications`, {
    headers: { Cookie: `auth_token=${token}` },
  });
  if (!res.ok) throw new Error(`getNotifications failed (${res.status}): ${await res.text()}`);
  return res.json();
}

async function clearNotifications(userId: string): Promise<void> {
  // Mark all read then rely on cleanup for actual deletion
  await fetch(`${BASE_URL}/api/notifications/read`, {
    method: 'POST',
    headers: { Cookie: `auth_token=${td.userToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ all: true }),
  });
}

test.describe('Feature 14: Notification Triggers', () => {
  test.beforeEach(async ({ request }) => {
    // Always reset booking to pending_designer so each trigger test starts clean
    td = await setupTestData(request);
  });

  test.afterAll(async ({ request }) => {
    await request.post(`${BASE_URL}/api/test/cleanup`, {
      headers: { 'x-test-secret': TEST_SECRET },
    });
  });

  // ── Test 1: Booking accept → booking_accepted notification ────────────────────
  test('accepting a booking should create a booking_accepted notification for the customer', async ({ request }) => {
    const beforeCount = (await getNotifications(td.userToken)).notifications.length;

    const acceptRes = await request.post(`${BASE_URL}/api/bookings/${td.bookingId}/accept`, {
      headers: authHeaders(td.designerToken),
    });
    expect(acceptRes.status(), `accept body: ${await acceptRes.text()}`).toBe(200);

    // Notifications are created synchronously inside the accept route
    const after = await getNotifications(td.userToken);
    expect(after.notifications.length).toBeGreaterThan(beforeCount);

    const notif = after.notifications.find(
      (n: { type: string; read: boolean }) => n.type === 'booking_accepted' && !n.read,
    );
    expect(notif).toBeDefined();
    expect(notif.title).toMatch(/accepted/i);
  });

  // ── Test 2: Booking reject → booking_rejected notification ────────────────────
  test('rejecting a booking should create a booking_rejected notification for the customer', async ({ request }) => {
    const beforeCount = (await getNotifications(td.userToken)).notifications.length;

    const rejectRes = await request.post(`${BASE_URL}/api/bookings/${td.bookingId}/reject`, {
      headers: authHeaders(td.designerToken),
      data: { reason: 'Unavailable for the requested dates' },
    });
    expect(rejectRes.status(), `reject body: ${await rejectRes.text()}`).toBe(200);

    const after = await getNotifications(td.userToken);
    expect(after.notifications.length).toBeGreaterThan(beforeCount);

    const notif = after.notifications.find(
      (n: { type: string }) => n.type === 'booking_rejected',
    );
    expect(notif).toBeDefined();
    expect(notif.title).toMatch(/not accepted/i);
  });

  // ── Test 3: Booking complete → booking_completed notification ─────────────────
  // Complete requires: pending_designer → accept (confirmed) → complete
  test('completing a booking should create a booking_completed notification for the customer', async ({ request }) => {
    // Step 1: Accept to move to confirmed
    const acceptRes = await request.post(`${BASE_URL}/api/bookings/${td.bookingId}/accept`, {
      headers: authHeaders(td.designerToken),
    });
    expect(acceptRes.status(), `accept body: ${await acceptRes.text()}`).toBe(200);

    const beforeCount = (await getNotifications(td.userToken)).notifications.length;

    // Step 2: Complete the booking
    const completeRes = await request.post(`${BASE_URL}/api/bookings/${td.bookingId}/complete`, {
      headers: authHeaders(td.designerToken),
    });
    expect(completeRes.status(), `complete body: ${await completeRes.text()}`).toBe(200);

    const after = await getNotifications(td.userToken);
    expect(after.notifications.length).toBeGreaterThan(beforeCount);

    const notif = after.notifications.find(
      (n: { type: string }) => n.type === 'booking_completed',
    );
    expect(notif).toBeDefined();
    expect(notif.title).toMatch(/completed/i);
  });

  // ── Test 4: Two events → two distinct notification types ──────────────────────
  test('each booking event creates a separate notification with the correct type', async ({ request }) => {
    // Accept the booking (creates booking_accepted)
    await request.post(`${BASE_URL}/api/bookings/${td.bookingId}/accept`, {
      headers: authHeaders(td.designerToken),
    });

    // Complete the booking (creates booking_completed)
    await request.post(`${BASE_URL}/api/bookings/${td.bookingId}/complete`, {
      headers: authHeaders(td.designerToken),
    });

    const notifications = await getNotifications(td.userToken);
    const types = notifications.notifications.map((n: { type: string }) => n.type);

    expect(types).toContain('booking_accepted');
    expect(types).toContain('booking_completed');
  });

  // ── Test 5: Notification not created for the designer ─────────────────────────
  test('booking events should NOT create notifications for the designer themselves', async ({ request }) => {
    // Accept triggers notifyBookingAccepted for CUSTOMER only
    const beforeDesigner = (await getNotifications(td.designerToken)).notifications.length;

    await request.post(`${BASE_URL}/api/bookings/${td.bookingId}/accept`, {
      headers: authHeaders(td.designerToken),
    });

    const afterDesigner = await getNotifications(td.designerToken);
    // Designer count should not change due to this event
    expect(afterDesigner.notifications.length).toBe(beforeDesigner);
  });

  // ── Test 6: Render ready notification (COMFY required) ────────────────────────
  test('completing a generation should trigger a render_ready notification', async ({ request }) => {
    if (!COMFY) {
      test.skip();
      return;
    }

    const fs = await import('fs');
    const path = await import('path');
    const imgBytes = fs.readFileSync(path.resolve(__dirname, '../../test-assets/living-room.jpg'));

    const beforeCount = (await getNotifications(td.userToken)).notifications.length;

    // Submit a room-changer job
    const formData = new FormData();
    formData.append('colorName', 'sky blue');
    formData.append('hex', '#87CEEB');
    formData.append('roomImage', new Blob([imgBytes], { type: 'image/jpeg' }), 'room.jpg');

    const submitRes = await fetch(`${BASE_URL}/api/ai/room-changer/generate`, {
      method: 'POST',
      headers: { Cookie: `auth_token=${td.userToken}` },
      body: formData,
    });
    expect(submitRes.status).toBe(202);

    // Wait for render completion (up to 120s for SDXL)
    let notifFound = false;
    for (let i = 0; i < 24 && !notifFound; i++) {
      await new Promise(r => setTimeout(r, 5_000));
      const after = await getNotifications(td.userToken);
      notifFound = after.notifications.some((n: { type: string }) => n.type === 'render_ready');
    }
    expect(notifFound, 'render_ready notification not received within 2 minutes').toBe(true);
  });

  // ── Test 7: Credits low notification (COMFY required) ────────────────────────
  test('dropping below credit threshold should trigger a credits_low notification', async ({}) => {
    if (!COMFY) {
      test.skip();
      return;
    }
    // This requires the app to call notifyCreditsLow() when threshold is crossed.
    // Tested separately by lowering user credits via admin and checking.
    // Placeholder: mark skip until credit threshold is hooked up.
    test.skip();
  });
});
