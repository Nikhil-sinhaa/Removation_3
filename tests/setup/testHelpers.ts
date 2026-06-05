import type { APIRequestContext } from '@playwright/test';

export const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
export const TEST_SECRET = process.env.TEST_SECRET || 'test_secret_local';

export interface TestData {
  adminToken: string;
  userToken: string;
  designerToken: string;
  adminId: string;
  userId: string;
  designerId: string;
  bookingId: string;
  projectId: string;
}

/**
 * Seeds test data via the test-only API endpoint and returns tokens + IDs.
 */
export async function setupTestData(request: APIRequestContext): Promise<TestData> {
  const res = await request.post(`${BASE_URL}/api/test/setup`, {
    headers: { 'x-test-secret': TEST_SECRET },
  });

  if (!res.ok()) {
    const text = await res.text();
    throw new Error(`Test setup failed (${res.status()}): ${text}`);
  }

  return res.json();
}

export function authCookie(token: string): string {
  return `auth_token=${token}`;
}

export function authHeaders(token: string): Record<string, string> {
  return {
    Cookie: `auth_token=${token}`,
    'Content-Type': 'application/json',
  };
}
