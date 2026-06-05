import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

test.describe('Multi-Room 3D Downloads E2E Verification', () => {
  const projectId = '6a103bd91cb509c9dfc820cf';
  const mainProjectId = '6a1040c725eb3ef1f2c00986';

  test.beforeEach(async ({ page }) => {
    // Hermetically re-seed project to its completed state
    execSync('node scratch/seed_full_project.mjs');
    // Navigate to homepage first to set up context
    await page.goto('/');
  });

  test('1. Download from 3D Room View Done Stage', async ({ page }) => {
    // Navigate to room-3d with projectId to directly view done stage
    await page.goto(`/room-3d?projectId=${projectId}`);
    
    // Wait for the done stage checkmark or title
    await expect(page.locator('text=Your 3D Room is Ready!')).toBeVisible({ timeout: 15000 });
    
    // Locate the "Download All Photos" button
    const downloadButton = page.locator('#download-all-photos-button');
    await expect(downloadButton).toBeVisible();

    // Trigger and intercept download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      downloadButton.click(),
    ]);

    // Save download
    const downloadPath = '/tmp/test_download.zip';
    if (fs.existsSync(downloadPath)) {
      fs.unlinkSync(downloadPath);
    }
    await download.saveAs(downloadPath);
    expect(fs.existsSync(downloadPath)).toBe(true);

    // Verify folder structure of downloaded ZIP
    const zipTestDir = '/tmp/zip_test';
    if (fs.existsSync(zipTestDir)) {
      fs.rmSync(zipTestDir, { recursive: true, force: true });
    }
    fs.mkdirSync(zipTestDir);

    // Unzip the file
    execSync(`unzip ${downloadPath} -d ${zipTestDir}`);

    // Verify file structure
    const projectFolder = path.join(zipTestDir, projectId);
    expect(fs.existsSync(projectFolder)).toBe(true);

    const inputFolder = path.join(projectFolder, 'input');
    const outputFolder = path.join(projectFolder, 'output');
    expect(fs.existsSync(inputFolder)).toBe(true);
    expect(fs.existsSync(outputFolder)).toBe(true);

    const inputFiles = fs.readdirSync(inputFolder);
    const outputFiles = fs.readdirSync(outputFolder);

    console.log('ZIP Structure Verification:');
    console.log('Input Files:', inputFiles);
    console.log('Output Files:', outputFiles);

    expect(inputFiles.length).toBe(3);
    expect(outputFiles.length).toBe(3);

    // Verify naming matches {projectId}_input_{index}.jpg / {projectId}_output_{index}.jpg
    expect(inputFiles.includes(`${projectId}_input_01.jpg`)).toBe(true);
    expect(inputFiles.includes(`${projectId}_input_02.jpg`)).toBe(true);
    expect(inputFiles.includes(`${projectId}_input_03.jpg`)).toBe(true);

    expect(outputFiles.includes(`${projectId}_output_01.jpg`)).toBe(true);
    expect(outputFiles.includes(`${projectId}_output_02.jpg`)).toBe(true);
    expect(outputFiles.includes(`${projectId}_output_03.jpg`)).toBe(true);
  });

  test('2. Download from Project Detail Page', async ({ page }) => {
    // Navigate directly to the project detail page
    await page.goto(`/projects/${mainProjectId}/multi-room-3d`);

    // Wait for the page content to load
    await expect(page.locator('text=Luxury Suite 3D').first()).toBeVisible({ timeout: 10000 });

    // Locate the "Download All" button
    const downloadButton = page.locator('#download-all-button');
    await expect(downloadButton).toBeVisible();

    // Trigger and intercept download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      downloadButton.click(),
    ]);

    const downloadPath = `/tmp/detail_download.zip`;
    await download.saveAs(downloadPath);
    expect(fs.existsSync(downloadPath)).toBe(true);
  });

  test('3. Download from Projects List Card without navigating away', async ({ page }) => {
    // Navigate to projects history dashboard
    await page.goto('/projects');

    // Wait for the dashboard and search results to be loaded
    await expect(page.locator('text=Royal Blue Suite 3D')).toBeVisible({ timeout: 10000 });

    // Locate the card for 'Royal Blue Suite 3D'
    const card = page.locator('.group', { hasText: 'Royal Blue Suite 3D' }).first();
    await expect(card).toBeVisible();

    // Hover to reveal floating download button
    await card.hover();

    // Locate and click the download button on the card (which shows only on hover)
    const cardDownloadButton = card.locator('a[title="Download all photos"]').first();
    await expect(cardDownloadButton).toBeVisible();

    // Trigger and intercept download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      cardDownloadButton.click(),
    ]);

    const downloadPath = `/tmp/card_download.zip`;
    await download.saveAs(downloadPath);
    expect(fs.existsSync(downloadPath)).toBe(true);

    // Verify we did NOT navigate away (url should still be /projects)
    expect(page.url().endsWith('/projects')).toBe(true);
  });
});
