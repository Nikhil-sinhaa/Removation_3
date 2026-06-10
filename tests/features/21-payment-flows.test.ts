/**
 * Feature 21: Payment Flows — Gate Tests
 *
 * Tests the pre-flight guards on payment endpoints without exercising
 * real payment providers. All assertions are on HTTP status codes and
 * response shape — no actual money moves in these tests.
 *
 * In the test environment:
 *   - Stripe is NOT configured (STRIPE_SECRET_KEY is a placeholder) → calls return 503.
 *   - Razorpay is configured but we only send fake/missing fields → 400 signature error.
 */

import { test, expect } from '@playwright/test';
import { BASE_URL, setupTestData, authHeaders, TEST_SECRET, type TestData } from '../setup/testHelpers';

let td: TestData;

// A syntactically valid but non-existent MongoDB ObjectId.
const NONEXISTENT_ID = '000000000000000000000001';

test.describe('Feature 21: Payment Flows', () => {
  test.beforeAll(async ({ request }) => {
    td = await setupTestData(request);
  });

  test.afterAll(async ({ request }) => {
    await request.post(`${BASE_URL}/api/test/cleanup`, {
      headers: { 'x-test-secret': TEST_SECRET },
    });
  });

  // ── Group 1: POST /api/payment/verify — Stripe path ──────────────────────────

  test('PAY-V01: POST /api/payment/verify with paymentMethod=stripe returns 401 when not authenticated', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/payment/verify`, {
      data: { paymentMethod: 'stripe' },
    });
    expect(res.status()).toBe(401);
  });

  test('PAY-V02: POST /api/payment/verify with paymentMethod=stripe and auth — Stripe gate fires', async ({ request }) => {
    // In the test environment STRIPE_SECRET_KEY is a placeholder so getStripe() returns null.
    // verifyStripePayment() returns 503 immediately. If Stripe were configured, missing
    // sessionId would produce 400 — so we accept both.
    const res = await request.post(`${BASE_URL}/api/payment/verify`, {
      headers: authHeaders(td.userToken),
      data: { paymentMethod: 'stripe' },
    });
    expect([400, 503]).toContain(res.status());
  });

  test('PAY-V03: POST /api/payment/verify with an invalid paymentMethod returns 400', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/payment/verify`, {
      headers: authHeaders(td.userToken),
      data: { paymentMethod: 'bitcoin' },
    });
    expect(res.status()).toBe(400);
    const data = await res.json();
    expect((data.error ?? '').toLowerCase()).toContain('invalid');
  });

  // ── Group 2: POST /api/payment/verify — Razorpay path ────────────────────────

  test('PAY-V04: POST /api/payment/verify with paymentMethod=razorpay requires auth (middleware gate)', async ({ request }) => {
    // The route code accepts null userId for Razorpay, but the middleware
    // protects all /api/payment/* routes → 401 for unauthenticated callers.
    const res = await request.post(`${BASE_URL}/api/payment/verify`, {
      data: { paymentMethod: 'razorpay' },
    });
    expect(res.status()).toBe(401);
  });

  test('PAY-V05: POST /api/payment/verify with paymentMethod=razorpay, auth, bad signature returns error', async ({ request }) => {
    // With auth but a fake signature, the HMAC check fails → 400 or lookup fails → 404/500.
    const res = await request.post(`${BASE_URL}/api/payment/verify`, {
      headers: authHeaders(td.userToken),
      data: {
        paymentMethod: 'razorpay',
        razorpayPaymentId: 'pay_test_fake',
        razorpayOrderId: 'order_test_fake',
        razorpaySignature: 'not_a_real_signature',
      },
    });
    expect([400, 404, 500]).toContain(res.status());
    expect(res.status()).not.toBe(200);
  });

  // ── Group 3: POST /api/bookings/[id]/payment-verify ─────────────────────────

  test('BOOK-V01: POST /api/bookings/[id]/payment-verify returns 401 without auth', async ({ request }) => {
    const res = await request.post(
      `${BASE_URL}/api/bookings/${NONEXISTENT_ID}/payment-verify`,
      { data: {} }
    );
    expect(res.status()).toBe(401);
  });

  test('BOOK-V02: POST /api/bookings/[id]/payment-verify returns 400 for an invalid ObjectId', async ({ request }) => {
    const res = await request.post(
      `${BASE_URL}/api/bookings/not-a-valid-id/payment-verify`,
      {
        headers: authHeaders(td.userToken),
        data: {},
      }
    );
    expect(res.status()).toBe(400);
  });

  test('BOOK-V03: POST /api/bookings/[id]/payment-verify returns 400 when Razorpay fields are missing', async ({ request }) => {
    // Valid ObjectId format but fields are absent — field-validation fires before DB lookup.
    const res = await request.post(
      `${BASE_URL}/api/bookings/${NONEXISTENT_ID}/payment-verify`,
      {
        headers: authHeaders(td.userToken),
        data: {},
      }
    );
    expect(res.status()).toBe(400);
  });

  test('BOOK-V04: POST /api/bookings/[id]/payment-verify returns 404 for non-existent booking ID', async ({ request }) => {
    // All required fields are present (strings), ObjectId format is valid.
    // DB lookup will find nothing → 404.
    const res = await request.post(
      `${BASE_URL}/api/bookings/${NONEXISTENT_ID}/payment-verify`,
      {
        headers: authHeaders(td.userToken),
        data: {
          razorpayPaymentId: 'pay_test_fake',
          razorpayOrderId: 'order_test_fake',
          razorpaySignature: 'not_a_real_signature',
        },
      }
    );
    expect(res.status()).toBe(404);
  });

  // ── Group 4: POST /api/webhook/stripe — Stripe webhook guards ────────────────

  test('STRIPE-WH01: POST /api/webhook/stripe returns 400 when stripe-signature header is missing', async ({ request }) => {
    const res = await request.post(`${BASE_URL}/api/webhook/stripe`, {
      data: JSON.stringify({ type: 'checkout.session.completed' }),
      headers: { 'content-type': 'application/json' },
    });
    // Missing stripe-signature → 400 before any Stripe processing.
    expect(res.status()).toBe(400);
  });

  test('STRIPE-WH02: POST /api/webhook/stripe with a dummy stripe-signature fires Stripe gate', async ({ request }) => {
    // With a signature present but Stripe not configured (test env), the route returns 503.
    // If Stripe were configured, constructEvent would fail the HMAC check → 400.
    const res = await request.post(`${BASE_URL}/api/webhook/stripe`, {
      data: JSON.stringify({ type: 'checkout.session.completed' }),
      headers: {
        'content-type': 'application/json',
        'stripe-signature': 't=123,v1=fakesignature',
      },
    });
    expect([400, 503]).toContain(res.status());
  });
});
