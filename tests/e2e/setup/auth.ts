// Mock auth for E2E tests — bypasses JWT when SKIP_AUTH=true
export const testUser = {
  id: 'test-user-e2e',
  email: 'e2e@test.com',
  role: 'customer',
};

export default async function globalSetup() {
  // No-op to satisfy Playwright globalSetup requirement
}
