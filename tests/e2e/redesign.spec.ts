import { test, expect, Page } from '@playwright/test';
import path from 'path';

/**
 * AI Redesign E2E Flow
 * 
 * Tests the full flow: Upload image → Select mode → Generate → Wait → Assert result.
 * 
 * PREREQUISITES:
 * - Dev server running at localhost:3000
 * - REPLICATE_API_TOKEN set in .env.local
 * - Valid Clerk test user (run `npx playwright codegen` to capture auth state)
 * - Sample image at tests/fixtures/sample-room.jpg
 * 
 * AUTH SETUP:
 * 1. Run: npx playwright codegen http://localhost:3000
 * 2. Log in manually in the launched browser
 * 3. Save the auth state: copy the storage state to tests/fixtures/auth.json
 * 4. Then these tests will use the saved auth automatically
 */

// Increase timeout for AI tests — generation can take 30-60s
test.setTimeout(120_000);

// Use stored auth state if available
test.use({
    storageState: path.join(__dirname, '../fixtures/auth.json'),
});

test.describe('Redesign Flow', () => {

    test('Full redesign pipeline: upload → generate → result', async ({ page }) => {
        // Navigate to editor
        await page.goto('/editor');

        // Verify editor loaded (check for the Design Studio header)
        await expect(page.getByText('Design Studio')).toBeVisible({ timeout: 10_000 });

        // Upload a test image
        const fileInput = page.locator('input[type="file"]');
        const sampleImage = path.join(__dirname, '../fixtures/sample-room.jpg');
        await fileInput.setInputFiles(sampleImage);

        // Wait for upload to complete
        await expect(page.getByText('Image uploaded')).toBeVisible({ timeout: 15_000 });

        // Verify "Redesign" mode is selected (default)
        const redesignButton = page.getByRole('button', { name: /Redesign/i });
        await expect(redesignButton).toBeVisible();

        // Click "Generate Design"
        const generateButton = page.getByRole('button', { name: /Generate Design/i });
        await expect(generateButton).toBeEnabled();
        await generateButton.click();

        // Verify generation started — progress bar or loading state should appear
        await expect(page.locator('[role="progressbar"], .animate-spin, text=processing')).toBeVisible({
            timeout: 5_000,
        });

        // Wait for generation to complete (AI takes 15-60 seconds)
        // Look for "Generation complete" toast OR a generated image appearing
        await expect(
            page.getByText(/Generation complete|variation/).or(
                page.locator('img[src*="replicate"]')
            )
        ).toBeVisible({ timeout: 90_000 });

        // Take a screenshot of the result for evidence
        await page.screenshot({ path: 'tests/results/redesign-success.png', fullPage: true });
    });

    test('Shows error message when API fails', async ({ page }) => {
        await page.goto('/editor');
        await expect(page.getByText('Design Studio')).toBeVisible({ timeout: 10_000 });

        // Upload image
        const fileInput = page.locator('input[type="file"]');
        const sampleImage = path.join(__dirname, '../fixtures/sample-room.jpg');
        await fileInput.setInputFiles(sampleImage);
        await expect(page.getByText('Image uploaded')).toBeVisible({ timeout: 15_000 });

        // Intercept API to force a failure
        await page.route('/api/generate', (route) => {
            route.fulfill({
                status: 503,
                contentType: 'application/json',
                body: JSON.stringify({
                    error: 'AI service not configured',
                    message: 'REPLICATE_API_TOKEN is missing',
                }),
            });
        });

        // Click generate
        await page.getByRole('button', { name: /Generate Design/i }).click();

        // Should show descriptive error, NOT generic "Please try again"
        await expect(
            page.getByText(/REPLICATE_API_TOKEN|not configured|unavailable/i)
        ).toBeVisible({ timeout: 5_000 });
    });

    test('Prevents generation without image upload', async ({ page }) => {
        await page.goto('/editor');
        await expect(page.getByText('Design Studio')).toBeVisible({ timeout: 10_000 });

        // Click generate without uploading
        const generateButton = page.getByRole('button', { name: /Generate Design/i });
        await generateButton.click();

        // Should show "upload an image" error
        await expect(page.getByText(/upload.*image/i)).toBeVisible({ timeout: 3_000 });
    });

});

test.describe('Mode Selection', () => {

    test('All transformation modes are clickable', async ({ page }) => {
        await page.goto('/editor');
        await expect(page.getByText('Design Studio')).toBeVisible({ timeout: 10_000 });

        const modes = ['Redesign', 'Fill Empty', 'Enhance', 'Edit Area', 'Remove', 'Exterior'];

        for (const mode of modes) {
            const button = page.getByRole('button', { name: new RegExp(mode, 'i') });
            await expect(button).toBeVisible();
            await button.click();
            // Button should become "selected" state
            await expect(button).toHaveClass(/ring-2|default/);
        }
    });

});
