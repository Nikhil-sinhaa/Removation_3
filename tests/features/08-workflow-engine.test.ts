import { test, expect } from '@playwright/test';
import { BASE_URL, setupTestData, authHeaders, type TestData } from '../setup/testHelpers';

let td: TestData;

test.describe('Feature 8: Workflow Engine', () => {
  test.beforeAll(async ({ request }) => {
    td = await setupTestData(request);
  });

  test('GET /api/admin/workflow requires admin role', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/admin/workflow`);
    expect(res.status()).toBe(401);
  });

  test('GET /api/admin/workflow returns states and transitions', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/admin/workflow`, {
      headers: authHeaders(td.adminToken),
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.states)).toBe(true);
    expect(Array.isArray(data.transitions)).toBe(true);
    expect(data.states.length).toBeGreaterThanOrEqual(8);
    expect(data.transitions.length).toBeGreaterThanOrEqual(10);
    expect(data).toHaveProperty('stats');
  });

  test('all expected state IDs are seeded', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/admin/workflow`, {
      headers: authHeaders(td.adminToken),
    });
    const { states } = await res.json();
    const stateIds = (states as Array<{ stateId: string }>).map(s => s.stateId);
    const expected = [
      'pending', 'accepted', 'in_progress', 'review',
      'completed', 'rejected', 'cancelled', 'disputed',
    ];
    for (const id of expected) {
      expect(stateIds, `Missing state: ${id}`).toContain(id);
    }
  });

  test('GET /api/bookings/[id]/transition returns available transitions', async ({ request }) => {
    if (!td.bookingId) { test.skip(); return; }
    const res = await request.get(
      `${BASE_URL}/api/bookings/${td.bookingId}/transition`,
      { headers: authHeaders(td.designerToken) }
    );
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('transitions');
    expect(data).toHaveProperty('currentState');
    expect(Array.isArray(data.transitions)).toBe(true);
  });

  test('designer can see accept and reject transitions for pending_designer booking', async ({ request }) => {
    if (!td.bookingId) { test.skip(); return; }
    const res = await request.get(
      `${BASE_URL}/api/bookings/${td.bookingId}/transition`,
      { headers: authHeaders(td.designerToken) }
    );
    const data = await res.json();
    // booking is in pending_designer state; accept and reject are valid from there
    const transIds = (data.transitions as Array<{ transitionId: string }>).map(t => t.transitionId);
    expect(transIds).toContain('accept');
    expect(transIds).toContain('reject');
  });

  test('invalid transition returns 400 with error', async ({ request }) => {
    if (!td.bookingId) { test.skip(); return; }
    // approve is only valid from 'review' or 'confirmed', not 'pending'
    const res = await request.post(
      `${BASE_URL}/api/bookings/${td.bookingId}/transition`,
      {
        headers: authHeaders(td.designerToken),
        data:    { transitionId: 'approve' },
      }
    );
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toBeTruthy();
  });

  test('reject without message returns 400', async ({ request }) => {
    if (!td.bookingId) { test.skip(); return; }
    const res = await request.post(
      `${BASE_URL}/api/bookings/${td.bookingId}/transition`,
      {
        headers: authHeaders(td.designerToken),
        data:    { transitionId: 'reject' },
      }
    );
    expect(res.status()).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('reason');
  });

  test('customer cannot accept (wrong role) returns 400', async ({ request }) => {
    if (!td.bookingId) { test.skip(); return; }
    const res = await request.post(
      `${BASE_URL}/api/bookings/${td.bookingId}/transition`,
      {
        headers: authHeaders(td.userToken),
        data:    { transitionId: 'accept' },
      }
    );
    expect(res.status()).toBe(400);
    const data = await res.json();
    expect(data.error.toLowerCase()).toContain('role');
  });

  test('accept transition moves booking to confirmed state', async ({ request }) => {
    if (!td.bookingId) { test.skip(); return; }
    const res = await request.post(
      `${BASE_URL}/api/bookings/${td.bookingId}/transition`,
      {
        headers: authHeaders(td.designerToken),
        data:    { transitionId: 'accept' },
      }
    );
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.newState).toBe('confirmed');
  });

  test('GET /api/bookings/[id]/history returns workflow events', async ({ request }) => {
    if (!td.bookingId) { test.skip(); return; }
    const res = await request.get(
      `${BASE_URL}/api/bookings/${td.bookingId}/history`,
      { headers: authHeaders(td.userToken) }
    );
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.events)).toBe(true);
    expect(data.events.length).toBeGreaterThanOrEqual(1);
    const lastEvent = data.events[data.events.length - 1] as Record<string, string>;
    expect(lastEvent.toState).toBe('confirmed');
    expect(lastEvent.transitionId).toBe('accept');
  });

  test('full state machine: confirmed → in_progress → review → completed', async ({ request }) => {
    if (!td.bookingId) { test.skip(); return; }

    // Start work (from confirmed)
    const startRes = await request.post(
      `${BASE_URL}/api/bookings/${td.bookingId}/transition`,
      {
        headers: authHeaders(td.designerToken),
        data:    { transitionId: 'start_work' },
      }
    );
    expect(startRes.status()).toBe(200);
    expect((await startRes.json()).newState).toBe('in_progress');

    // Submit for review
    const reviewRes = await request.post(
      `${BASE_URL}/api/bookings/${td.bookingId}/transition`,
      {
        headers: authHeaders(td.designerToken),
        data:    { transitionId: 'submit_for_review' },
      }
    );
    expect(reviewRes.status()).toBe(200);
    expect((await reviewRes.json()).newState).toBe('review');

    // Approve (customer)
    const approveRes = await request.post(
      `${BASE_URL}/api/bookings/${td.bookingId}/transition`,
      {
        headers: authHeaders(td.userToken),
        data:    { transitionId: 'approve' },
      }
    );
    expect(approveRes.status()).toBe(200);
    expect((await approveRes.json()).newState).toBe('completed');
  });

  test('history has all 4 transitions after full flow', async ({ request }) => {
    if (!td.bookingId) { test.skip(); return; }
    const res = await request.get(
      `${BASE_URL}/api/bookings/${td.bookingId}/history`,
      { headers: authHeaders(td.userToken) }
    );
    const data = await res.json();
    expect(data.events.length).toBeGreaterThanOrEqual(4);
    const transIds = (data.events as Array<{ transitionId: string }>).map(e => e.transitionId);
    expect(transIds).toContain('accept');
    expect(transIds).toContain('start_work');
    expect(transIds).toContain('submit_for_review');
    expect(transIds).toContain('approve');
  });

  test('PATCH /api/admin/workflow/transitions/[id] disables a transition', async ({ request }) => {
    const workflowRes = await request.get(`${BASE_URL}/api/admin/workflow`, {
      headers: authHeaders(td.adminToken),
    });
    const { transitions } = await workflowRes.json();
    const raiseDispute = (transitions as Array<{ transitionId: string; _id: string }>)
      .find(t => t.transitionId === 'raise_dispute');
    if (!raiseDispute) { test.skip(); return; }

    const patchRes = await request.patch(
      `${BASE_URL}/api/admin/workflow/transitions/${raiseDispute._id}`,
      {
        headers: authHeaders(td.adminToken),
        data:    { enabled: false },
      }
    );
    expect(patchRes.status()).toBe(200);
    const data = await patchRes.json();
    expect(data.success).toBe(true);
    expect(data.transition.enabled).toBe(false);

    // Re-enable
    await request.patch(
      `${BASE_URL}/api/admin/workflow/transitions/${raiseDispute._id}`,
      {
        headers: authHeaders(td.adminToken),
        data:    { enabled: true },
      }
    );
  });

  test('each transition has required fields', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/admin/workflow`, {
      headers: authHeaders(td.adminToken),
    });
    const { transitions } = await res.json();
    for (const t of transitions as Array<Record<string, unknown>>) {
      expect(t).toHaveProperty('transitionId');
      expect(t).toHaveProperty('label');
      expect(t).toHaveProperty('fromStates');
      expect(t).toHaveProperty('toState');
      expect(t).toHaveProperty('allowedRoles');
      expect(t).toHaveProperty('enabled');
    }
  });
});
