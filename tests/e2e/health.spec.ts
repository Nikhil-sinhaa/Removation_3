import { test, expect } from '@playwright/test';

/**
 * AI Pipeline Health Check Tests
 * 
 * These tests verify the core AI pipeline endpoints and UI components
 * are functioning without triggering actual AI generation (no credits used).
 */

test.describe('AI Pipeline Health', () => {

    test('Homepage loads successfully', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/Removation/i);
    });

    test('Editor page loads', async ({ page }) => {
        await page.goto('/editor');
        // Should either show the editor or redirect to sign-in
        const currentUrl = page.url();
        expect(
            currentUrl.includes('/editor') || currentUrl.includes('/sign-in')
        ).toBeTruthy();
    });

    test('API health — generate endpoint rejects unauthenticated', async ({ request }) => {
        const response = await request.post('/api/generate', {
            data: {
                imageUrl: 'https://example.com/test.jpg',
                mode: 'redesign',
                style: 'modern-minimalist',
                roomType: 'living-room',
            },
        });
        // Should return 401 Unauthorized (not 500)
        expect(response.status()).toBe(401);
    });

    test('API health — enhance endpoint rejects unauthenticated', async ({ request }) => {
        const response = await request.post('/api/enhance', {
            data: { imageUrl: 'https://example.com/test.jpg' },
        });
        expect(response.status()).toBe(401);
    });

    test('API health — remove-object endpoint rejects unauthenticated', async ({ request }) => {
        const response = await request.post('/api/remove-object', {
            data: { imageUrl: 'https://example.com/test.jpg' },
        });
        expect(response.status()).toBe(401);
    });

    test('API health — sketch-to-render endpoint rejects unauthenticated', async ({ request }) => {
        const response = await request.post('/api/sketch-to-render', {
            data: { sketchUrl: 'https://example.com/test.jpg' },
        });
        expect(response.status()).toBe(401);
    });

});
