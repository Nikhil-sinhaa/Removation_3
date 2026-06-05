import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for the 9-feature integration test suite.
 * Assumes the dev server is already running on port 3000.
 * Run with: npx playwright test --config=playwright.features.config.ts
 */
export default defineConfig({
  testDir:       './tests/features',
  timeout:       45_000,
  retries:       0,
  workers:       1,
  reporter:      'list',
  fullyParallel: false,

  use: {
    baseURL:           process.env.TEST_BASE_URL || 'http://localhost:3000',
    ignoreHTTPSErrors: true,
    actionTimeout:     15_000,
    headless:          true,
    extraHTTPHeaders: {
      'x-test-secret': process.env.TEST_SECRET || 'test_secret_local',
    },
  },

  projects: [
    {
      name: 'feature-tests',
      use:  { ...devices['Desktop Chrome'] },
    },
  ],
});
