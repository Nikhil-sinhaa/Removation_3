import { defineConfig, devices } from '@playwright/test';

const testPort = process.env.TEST_PORT || '3001';
const featureBaseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: false, // AI tests should run sequentially
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1, // Single worker for AI pipeline tests
    reporter: [
        ['html', { open: 'never' }],
        ['list'],
    ],
    globalSetup: './tests/e2e/setup/auth.ts',

    use: {
        baseURL: `http://localhost:${testPort}`,
        headless: false, // Set true in CI
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'retain-on-failure',
    },

    // Start dev server automatically
    webServer: {
        command: `SKIP_AUTH=true PORT=${testPort} npm run dev`,
        port: parseInt(testPort),
        reuseExistingServer: false, // always start fresh test server
        timeout: 120_000,
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'feature-tests',
            testDir: './tests/features',
            use: {
                ...devices['Desktop Chrome'],
                baseURL: featureBaseUrl,
                headless: true,
                extraHTTPHeaders: {
                    'x-test-secret': process.env.TEST_SECRET || 'test_secret_local',
                },
            },
        },
    ],
});
