import { test as setup, expect } from '@playwright/test';
import path from 'path';

/**
 * Auth Setup — Run once to capture Clerk login state
 * 
 * HOW TO USE:
 * 1. Run: npx playwright test tests/e2e/auth.setup.ts --headed
 * 2. This will open a browser, navigate to sign-in
 * 3. You manually log in with your test credentials
 * 4. The storage state (cookies, localStorage) is saved to tests/fixtures/auth.json
 * 5. All subsequent tests reuse this auth state — no login needed
 * 
 * ALTERNATIVE (faster):
 * Run: npx playwright codegen http://localhost:3000/sign-in
 * Log in manually, then copy the generated auth state.
 */

const authFile = path.join(__dirname, '../fixtures/auth.json');

setup('authenticate', async ({ page }) => {
    // Go to sign-in page
    await page.goto('/sign-in');

    // Wait for user to manually sign in
    // The test will pause here — sign in with your test account in the browser
    console.log('\n🔐 Please sign in manually in the browser window...\n');

    // Wait until we're redirected away from sign-in (indicates successful login)
    await page.waitForURL((url) => !url.pathname.includes('sign-in'), {
        timeout: 120_000, // 2 minutes to manually log in
    });

    // Verify we're authenticated — check for dashboard or editor access
    await expect(page.locator('body')).toBeVisible();

    // Save auth state
    await page.context().storageState({ path: authFile });

    console.log(`✅ Auth state saved to ${authFile}`);
});
