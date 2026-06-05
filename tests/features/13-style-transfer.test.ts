/**
 * Feature 13: Style Transfer — Config unit tests + HTTP validation tests.
 *
 * Tests 1–7 are pure unit tests: they import config directly and use no HTTP.
 * They can be run by the Playwright test runner without any fixtures.
 *
 * Tests 8–10 are HTTP validation tests (auth/body guards). They do NOT require
 * ComfyUI — they only test request validation before any AI work starts.
 *
 * Tests 11+ require COMFY=true because they exercise the full generation pipeline.
 */

import { test, expect } from '@playwright/test';
import {
  STYLE_PRESETS,
  ROOM_TYPES,
  getPresetById,
  getPresetsByRoomType,
  getPresetsByCategory,
  getVariantById,
} from '../../config/style-presets';
import { BASE_URL, setupTestData, authHeaders, TEST_SECRET, type TestData } from '../setup/testHelpers';

let td: TestData;
const COMFY = process.env.COMFYUI_AVAILABLE === 'true';

// Hex pattern — SDXL prompts must not contain hex codes (rule from CLAUDE.md)
const HEX_PATTERN = /#[0-9A-Fa-f]{6}\b/;

test.describe('Feature 13: Style Transfer', () => {
  test.beforeAll(async ({ request }) => {
    td = await setupTestData(request);
  });

  test.afterAll(async ({ request }) => {
    await request.post(`${BASE_URL}/api/test/cleanup`, {
      headers: { 'x-test-secret': TEST_SECRET },
    });
  });

  // ── Unit tests — config integrity ─────────────────────────────────────────────

  test('STYLE_PRESETS array is non-empty and has expected presets', () => {
    expect(Array.isArray(STYLE_PRESETS)).toBe(true);
    expect(STYLE_PRESETS.length).toBeGreaterThanOrEqual(5);
    const ids = STYLE_PRESETS.map(p => p.id);
    expect(ids).toContain('modern');
    expect(ids).toContain('japandi');
    expect(ids).toContain('minimalistic');
    expect(ids).toContain('luxury');
    expect(ids).toContain('traditional-indian');
  });

  test('every preset has required fields with correct types', () => {
    for (const preset of STYLE_PRESETS) {
      expect(typeof preset.id,          `${preset.id}.id`).toBe('string');
      expect(typeof preset.label,       `${preset.id}.label`).toBe('string');
      expect(typeof preset.labelHi,     `${preset.id}.labelHi`).toBe('string');
      expect(typeof preset.icon,        `${preset.id}.icon`).toBe('string');
      expect(typeof preset.category,    `${preset.id}.category`).toBe('string');
      expect(typeof preset.description, `${preset.id}.description`).toBe('string');
      expect(Array.isArray(preset.roomTypes), `${preset.id}.roomTypes`).toBe(true);
      expect(preset.roomTypes.length,         `${preset.id}.roomTypes.length`).toBeGreaterThan(0);
      expect(Array.isArray(preset.variants),  `${preset.id}.variants`).toBe(true);
      expect(typeof preset.defaultPrompt,     `${preset.id}.defaultPrompt`).toBe('string');
      expect(typeof preset.defaultNegativePrompt, `${preset.id}.defaultNegativePrompt`).toBe('string');
      expect(typeof preset.getReferenceImage, `${preset.id}.getReferenceImage`).toBe('function');
    }
  });

  test('every preset has at least 2 variants with required fields', () => {
    for (const preset of STYLE_PRESETS) {
      expect(preset.variants.length, `${preset.id} should have ≥ 2 variants`).toBeGreaterThanOrEqual(2);
      for (const variant of preset.variants) {
        expect(typeof variant.id,           `${preset.id}/${variant.id}.id`).toBe('string');
        expect(typeof variant.label,        `${preset.id}/${variant.id}.label`).toBe('string');
        expect(typeof variant.description,  `${preset.id}/${variant.id}.description`).toBe('string');
        expect(typeof variant.promptSuffix, `${preset.id}/${variant.id}.promptSuffix`).toBe('string');
        // thumbnail is intentionally NOT stored in the variant config —
        // it is computed at render time from the user-selected roomType:
        // `/style-references/${preset.id}/${selectedRoomType}/ref-${index+1}.jpeg`
        // Asserting it does NOT exist here to prevent future regressions.
        expect((variant as any).thumbnail, `${preset.id}/${variant.id} should not have a hardcoded thumbnail`).toBeUndefined();
      }
    }
  });

  test('getPresetById returns correct preset and undefined for unknown id', () => {
    const modern = getPresetById('modern');
    expect(modern).toBeDefined();
    expect(modern?.id).toBe('modern');
    expect(modern?.label).toBe('Modern');

    const missing = getPresetById('does-not-exist');
    expect(missing).toBeUndefined();
  });

  test('getPresetsByRoomType returns only presets that support that room type', () => {
    for (const { id: roomType } of ROOM_TYPES) {
      const presets = getPresetsByRoomType(roomType);
      expect(presets.length).toBeGreaterThan(0);
      for (const preset of presets) {
        expect(preset.roomTypes).toContain(roomType);
      }
    }
  });

  test('getPresetsByCategory returns only presets with the matching category', () => {
    const luxuryPresets = getPresetsByCategory('luxury');
    for (const p of luxuryPresets) {
      expect(p.category).toBe('luxury');
    }
  });

  // Critical rule from CLAUDE.md: hex codes in prompts inject noise into SDXL
  test('no hex codes appear in any defaultPrompt or variant promptSuffix', () => {
    for (const preset of STYLE_PRESETS) {
      expect(HEX_PATTERN.test(preset.defaultPrompt), `${preset.id}.defaultPrompt has hex`).toBe(false);
      expect(HEX_PATTERN.test(preset.defaultNegativePrompt), `${preset.id}.defaultNegativePrompt has hex`).toBe(false);
      for (const variant of preset.variants) {
        expect(HEX_PATTERN.test(variant.promptSuffix), `${preset.id}/${variant.id}.promptSuffix has hex`).toBe(false);
      }
    }
  });

  test('getReferenceImage returns a path under /style-references/', () => {
    for (const preset of STYLE_PRESETS) {
      for (const roomType of preset.roomTypes) {
        const path = preset.getReferenceImage(roomType);
        expect(typeof path).toBe('string');
        expect(path).toMatch(/^\/style-references\//);
      }
    }
  });

  test('getVariantById returns the correct variant', () => {
    const japandi = getPresetById('japandi');
    const firstVariant = japandi?.variants[0];
    if (!firstVariant) throw new Error('japandi has no variants');

    const found = getVariantById('japandi', firstVariant.id);
    expect(found).toBeDefined();
    expect(found?.id).toBe(firstVariant.id);

    const missing = getVariantById('japandi', 'does-not-exist');
    expect(missing).toBeUndefined();
  });

  // ── HTTP validation tests ──────────────────────────────────────────────────────

  test('POST /api/ai/style-transfer without auth returns 401', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/ai/style-transfer`);
    expect(res.status()).toBe(401);
  });

  test('POST /api/ai/style-transfer without roomImage returns 400', async ({ request }) => {
    // Send an empty multipart form — missing required roomImage field
    const res = await request.post(`${BASE_URL}/api/ai/style-transfer`, {
      headers: { Cookie: `auth_token=${td.userToken}` },
      multipart: {
        presetId: 'japandi',
      },
    });
    expect(res.status()).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/room image/i);
  });

  // ── COMFY-dependent test ───────────────────────────────────────────────────────

  test('POST /api/ai/style-transfer with valid form returns 202 and queue info', async ({ request }) => {
    if (!COMFY) {
      test.skip();
      return;
    }

    const fs = await import('fs');
    const path = await import('path');
    const imgPath = path.resolve(__dirname, '../../test-assets/living-room.jpg');
    const imgBytes = fs.readFileSync(imgPath);

    const res = await request.post(`${BASE_URL}/api/ai/style-transfer`, {
      headers: { Cookie: `auth_token=${td.userToken}` },
      multipart: {
        roomImage: { name: 'living-room.jpg', mimeType: 'image/jpeg', buffer: imgBytes },
        presetId:  'japandi',
        roomType:  'livingroom',
      },
    });
    expect(res.status(), `body: ${await res.text()}`).toBe(202);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data).toHaveProperty('jobId');
    expect(data).toHaveProperty('renderId');
    expect(data).toHaveProperty('queuePosition');
    expect(data.status).toBe('queued');
  });
});
