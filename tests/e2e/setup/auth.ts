// Mock auth for E2E tests — bypasses JWT when SKIP_AUTH=true
export const testUser = {
  id: 'test-user-e2e',
  email: 'e2e@test.com',
  role: 'customer',
};
