#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Manually parse .env.local to avoid dependency errors on missing dotenv module
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      process.env[key] = val;
    }
  });
}

const API_KEY = process.env.MARBLE_API_KEY;
const BASE = 'https://api.worldlabs.ai/marble/v1';

async function testMarble() {
  if (!API_KEY) {
    console.error('ERROR: MARBLE_API_KEY is not defined in process.env or .env.local');
    process.exit(1);
  }

  console.log('API Key:', API_KEY.substring(0, 12) + '...');

  // Find any painted image to test with
  const rendersDir = path.join(__dirname, '../public/renders');
  const files = fs.readdirSync(rendersDir)
    .filter(f => f.endsWith('.png') || f.endsWith('.jpg'));

  if (files.length === 0) {
    console.error('No images in public/renders/');
    process.exit(1);
  }

  const testImage = path.join(rendersDir, files[0]);
  console.log('Test image:', testImage);

  const imageBuffer = fs.readFileSync(testImage);
  const filename = path.basename(testImage);
  const extension = filename.split('.').pop();

  // Step 1: Prepare upload
  console.log('\n--- Step 1: Prepare Upload ---');
  const prepRes = await fetch(`${BASE}/media-assets:prepare_upload`, {
    method: 'POST',
    headers: {
      'WLT-Api-Key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      file_name: filename,
      extension,
      kind: 'image',
    }),
  });

  const prepData = await prepRes.json();
  console.log('Status:', prepRes.status);
  console.log('Response:', JSON.stringify(prepData, null, 2));

  if (!prepRes.ok) {
    console.error('FAILED at prepare upload');
    process.exit(1);
  }

  const assetId = prepData.media_asset?.media_asset_id;
  const uploadUrl = prepData.upload_info?.upload_url;
  const reqHeaders = prepData.upload_info?.required_headers || {};

  console.log('Asset ID:', assetId);
  console.log('Upload URL (first 80 chars):', uploadUrl?.substring(0, 80));

  // Step 2: Upload image
  console.log('\n--- Step 2: Upload Image ---');
  const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { ...reqHeaders, 'Content-Type': mimeType },
    body: imageBuffer,
  });
  console.log('Upload status:', uploadRes.status);

  if (!uploadRes.ok) {
    console.error('FAILED at upload');
    process.exit(1);
  }

  console.log('✅ Upload successful');
  console.log('\nAsset ID to use in generation:', assetId);
}

testMarble().catch(console.error);
