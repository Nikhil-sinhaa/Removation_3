/**
 * Feature 20: AI Routes — Auth & Input Gate Tests
 *
 * For each AI generation route we verify two invariants:
 *   1. No auth → 401 Unauthorized (auth check fires before any work)
 *   2. Auth + no image → 400 Bad Request (field validation fires before AI/credits)
 *
 * We do NOT test actual AI generation — only the pre-flight gates.
 * All FormData requests use native fetch() because Playwright's APIRequestContext
 * cannot send multipart/form-data bodies directly.
 */

import { test, expect } from '@playwright/test';
import { BASE_URL, setupTestData, TEST_SECRET, type TestData } from '../setup/testHelpers';

let td: TestData;

test.describe('Feature 20: AI Routes Auth & Input Validation', () => {
  test.beforeAll(async ({ request }) => {
    td = await setupTestData(request);
  });

  test.afterAll(async ({ request }) => {
    await request.post(`${BASE_URL}/api/test/cleanup`, {
      headers: { 'x-test-secret': TEST_SECRET },
    });
  });

  // ── Helper: POST FormData without image ──────────────────────────────────────

  async function postNoAuth(path: string, extraFields: Record<string, string> = {}) {
    const fd = new FormData();
    for (const [k, v] of Object.entries(extraFields)) {
      fd.append(k, v);
    }
    return fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      body: fd,
      // no Cookie header — intentionally unauthenticated
    });
  }

  async function postAuthNoImage(path: string, extraFields: Record<string, string> = {}) {
    const fd = new FormData();
    for (const [k, v] of Object.entries(extraFields)) {
      fd.append(k, v);
    }
    return fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { Cookie: `auth_token=${td.userToken}` },
      body: fd,
    });
  }

  // ── Room Changer ─────────────────────────────────────────────────────────────

  test('RC-01: POST /api/ai/room-changer/generate returns 401 without auth', async () => {
    const res = await postNoAuth('/api/ai/room-changer/generate', {
      colorName: 'sky blue',
      hex: '#87CEEB',
    });
    expect(res.status).toBe(401);
  });

  test('RC-02: POST /api/ai/room-changer/generate returns 400 when roomImage is missing', async () => {
    // colorName and hex are present; image check fires first and returns 400.
    const res = await postAuthNoImage('/api/ai/room-changer/generate', {
      colorName: 'sky blue',
      hex: '#87CEEB',
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect((data.error ?? '').toLowerCase()).toContain('image');
  });

  // ── Ceiling Changer ──────────────────────────────────────────────────────────

  test('CC-01: POST /api/ai/ceiling-changer/generate returns 401 without auth', async () => {
    const res = await postNoAuth('/api/ai/ceiling-changer/generate');
    expect(res.status).toBe(401);
  });

  test('CC-02: POST /api/ai/ceiling-changer/generate returns 400 when roomImage is missing', async () => {
    // queue depth 0 and dev mode bypass credits → image validation fires.
    const res = await postAuthNoImage('/api/ai/ceiling-changer/generate', {
      colorName: 'white',
      hex: '#FFFFFF',
    });
    expect(res.status).toBe(400);
  });

  // ── Furniture Remover ────────────────────────────────────────────────────────

  test('FR-01: POST /api/ai/furniture-remover/generate returns 401 without auth', async () => {
    const res = await postNoAuth('/api/ai/furniture-remover/generate');
    expect(res.status).toBe(401);
  });

  test('FR-02: POST /api/ai/furniture-remover/generate returns 400 when roomImage is missing', async () => {
    const res = await postAuthNoImage('/api/ai/furniture-remover/generate');
    expect(res.status).toBe(400);
  });

  // ── Lighting ─────────────────────────────────────────────────────────────────

  test('LT-01: POST /api/ai/lighting returns 401 without auth', async () => {
    const res = await postNoAuth('/api/ai/lighting');
    expect(res.status).toBe(401);
  });

  test('LT-02: POST /api/ai/lighting returns 400 when image field is missing', async () => {
    // Route accepts `image` or `roomImage`; with neither → 400.
    const res = await postAuthNoImage('/api/ai/lighting', {
      preset: 'golden_hour',
    });
    expect(res.status).toBe(400);
  });

  // ── Redesign ─────────────────────────────────────────────────────────────────

  test('RD-01: POST /api/ai/redesign returns 401 without auth', async () => {
    const res = await postNoAuth('/api/ai/redesign');
    expect(res.status).toBe(401);
  });

  test('RD-02: POST /api/ai/redesign returns 400 when image is missing', async () => {
    // auth → queue check (0 items) → credit bypass in dev → image check → 400.
    const res = await postAuthNoImage('/api/ai/redesign');
    expect(res.status).toBe(400);
  });

  // ── Style Transfer ───────────────────────────────────────────────────────────

  test('ST-01: POST /api/ai/style-transfer returns 401 without auth', async () => {
    const res = await postNoAuth('/api/ai/style-transfer');
    expect(res.status).toBe(401);
  });

  test('ST-02: POST /api/ai/style-transfer returns 400 when roomImage is missing', async () => {
    // Image check fires before the IP-Adapter pre-flight → 400.
    const res = await postAuthNoImage('/api/ai/style-transfer', { presetId: 'japandi' });
    expect(res.status).toBe(400);
  });

  // ── Remove Object ────────────────────────────────────────────────────────────

  test('RO-01: POST /api/ai/remove-object returns 401 without auth', async () => {
    const res = await postNoAuth('/api/ai/remove-object');
    expect(res.status).toBe(401);
  });

  test('RO-02: POST /api/ai/remove-object returns 400 when image is missing', async () => {
    const res = await postAuthNoImage('/api/ai/remove-object');
    expect(res.status).toBe(400);
  });

  // ── Recolor ──────────────────────────────────────────────────────────────────

  test('RC2-01: POST /api/ai/recolor returns 401 without auth', async () => {
    const res = await postNoAuth('/api/ai/recolor');
    expect(res.status).toBe(401);
  });

  test('RC2-02: POST /api/ai/recolor returns 400 when image is missing', async () => {
    const res = await postAuthNoImage('/api/ai/recolor');
    expect(res.status).toBe(400);
  });

  // ── Ultra Pro ────────────────────────────────────────────────────────────────

  test('UP-01: POST /api/ai/ultra-pro returns 401 without auth', async () => {
    const res = await postNoAuth('/api/ai/ultra-pro');
    expect(res.status).toBe(401);
  });

  test('UP-02: POST /api/ai/ultra-pro returns 400 when image is missing', async () => {
    const res = await postAuthNoImage('/api/ai/ultra-pro', {
      data: JSON.stringify({ roomType: 'Living Room' }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect((data.error ?? '').toLowerCase()).toContain('image');
  });

  // ── Furniture Placement Generate ─────────────────────────────────────────────

  test('FP-01: POST /api/ai/furniture-placement/generate returns 401 without auth', async () => {
    const res = await postNoAuth('/api/ai/furniture-placement/generate');
    expect(res.status).toBe(401);
  });

  test('FP-02: POST /api/ai/furniture-placement/generate returns 400 when roomImage is missing', async () => {
    // auth → queue check → credit bypass in dev → image check → 400.
    const res = await postAuthNoImage('/api/ai/furniture-placement/generate');
    expect(res.status).toBe(400);
  });
});
