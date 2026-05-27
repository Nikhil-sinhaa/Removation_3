import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import { execSync } from 'child_process';

test.describe('Multi-Room 3D Enhancements E2E Verification', () => {
  const projectId = '6a103bd91cb509c9dfc820cf';

  test.beforeEach(async ({ page }) => {
    // Hermetically re-seed project to its completed state
    execSync('node scratch/seed_full_project.mjs');
    // Navigate to homepage first to set up context
    await page.goto('/');
  });

  test('1. Done Stage Layout: Exact Marble URL, Copy, Explore, Rating, and Download', async ({ page }) => {
    // Navigate to room-3d with projectId to directly view done stage
    await page.goto(`/room-3d?projectId=${projectId}`);

    // Wait for the done stage checkmark or title
    await expect(page.locator('text=Your 3D Room is Ready!')).toBeVisible({ timeout: 15000 });

    // 1. Verify direct marble url text is displayed
    const urlSpan = page.locator('span:has-text("https://marble3d.com/world/demo-bedroom-3d")');
    await expect(urlSpan).toBeVisible();

    // 2. Verify "Explore 3D Room in Marble" button is visible and links to the correct URL
    const exploreBtn = page.locator('a:has-text("Explore 3D Room in Marble")');
    await expect(exploreBtn).toBeVisible();
    await expect(exploreBtn).toHaveAttribute('href', 'https://marble3d.com/world/demo-bedroom-3d');

    // 3. Verify copy button works
    const copyBtn = page.locator('button[title="Copy URL"]');
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();
    
    // Checkmark feedback should show up
    const checkmarkIcon = page.locator('button[title="Copy URL"] svg.text-green-400');
    await expect(checkmarkIcon).toBeVisible();

    // 4. Verify Rating/Feedback component is visible
    await expect(page.locator('text=How was your 3D room experience?')).toBeVisible();

    // Click 5 stars
    const starButtons = page.locator('button.transition-transform');
    await expect(starButtons).toHaveCount(5);
    await starButtons.nth(4).click(); // Click 5th star

    // Verify rating label shows "Excellent!"
    await expect(page.locator('text=Excellent!')).toBeVisible();

    // Fill optional comment
    const commentTextArea = page.locator('textarea[placeholder="Tell us more (optional)..."]');
    await expect(commentTextArea).toBeVisible();
    await commentTextArea.fill('This multi-room 3D experience is spectacular!');

    // Click Submit Feedback
    const submitBtn = page.locator('button:has-text("Submit Feedback")');
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Verify thank you message
    await expect(page.locator('text=Thank you for your feedback!')).toBeVisible();
  });

  test('2. Cancel Generation and Re-generate', async ({ page }) => {
    // Test the cancel API route directly
    const cancelRes = await page.request.post(`/api/multi-room/cancel/${projectId}`);
    expect(cancelRes.ok()).toBe(true);

    const cancelData = await cancelRes.json();
    expect(cancelData.success).toBe(true);

    // Verify status returns cancelled
    const statusRes = await page.request.get(`/api/multi-room/status/${projectId}`);
    expect(statusRes.ok()).toBe(true);
    const statusData = await statusRes.json();
    expect(statusData.marbleStatus).toBe('cancelled');

    // Go to page with this projectId, should show stopped page
    await page.goto(`/room-3d?projectId=${projectId}`);
    await expect(page.locator('text=Generation Stopped')).toBeVisible({ timeout: 10000 });
    
    // Check "Download Painted Photos" button is visible
    const downloadPaintedBtn = page.locator('a:has-text("Download Painted Photos")');
    await expect(downloadPaintedBtn).toBeVisible();

    // Check "Try Generate Again" button is visible
    const tryAgainBtn = page.locator('button:has-text("Try Generate Again")');
    await expect(tryAgainBtn).toBeVisible();
  });
});
