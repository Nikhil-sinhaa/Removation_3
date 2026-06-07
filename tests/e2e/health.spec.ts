import { test, expect } from '@playwright/test';

test.describe('ComfyUI Health Endpoint E2E Verification', () => {
  test('returns ComfyUI health details or structured fallback/error', async ({ request }) => {
    const response = await request.get('/api/health/comfyui');
    
    // The health endpoint returns 200 if ComfyUI is up and running, or 503 if down/unhealthy.
    // Both are structured JSON responses.
    expect([200, 503, 500]).toContain(response.status());
    
    const body = await response.json();
    expect(body).toHaveProperty('status');
    expect(['ok', 'error']).toContain(body.status);
    expect(body).toHaveProperty('timestamp');
  });
});
