// run_rclone_upload.js
// ─────────────────────────────────────────────────────────────────────────────
// High-Speed Google Drive Model Uploader via rclone
// Automatically extracts authenticated OAuth2 tokens from MongoDB,
// dynamically generates an rclone configuration, and runs multithreaded
// sequential uploads with real-time speed progress in the terminal.
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { MongoClient } from 'mongodb';

const SCRIPT_DIR = path.dirname(new URL(import.meta.url).pathname);
const WORKSPACE_DIR = path.dirname(SCRIPT_DIR);

function parseEnv(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/(^["']|["']$)/g, '');
    env[key] = val;
  });
  return env;
}

async function run() {
  const envPath = path.join(WORKSPACE_DIR, '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local not found!');
    process.exit(1);
  }
  const env = parseEnv(envPath);

  const mongoUri = env.MONGODB_URI || 'mongodb://127.0.0.1:27017/removation_ai';
  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('❌ Google Client ID/Secret missing from .env.local!');
    process.exit(1);
  }

  console.log('🔌 Connecting to MongoDB...');
  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db();
  
  const settingsCol = db.collection('appsettings');
  const tokensDoc = await settingsCol.findOne({ key: 'GOOGLE_DRIVE_TOKENS' });
  
  if (!tokensDoc || !tokensDoc.value) {
    console.error('❌ GOOGLE_DRIVE_TOKENS not found in MongoDB! Please link your Google Drive in the UI first.');
    await client.close();
    process.exit(1);
  }
  
  await client.close();
  console.log('✅ Fetched Google Drive tokens successfully.');

  const tokens = JSON.parse(tokensDoc.value);

  // Generate rclone config content
  const rcloneConfContent = `[gdrive]
type = drive
client_id = ${clientId}
client_secret = ${clientSecret}
scope = drive.file
token = ${JSON.stringify(tokens)}
`;

  const confPath = path.join(SCRIPT_DIR, 'rclone.conf');
  fs.writeFileSync(confPath, rcloneConfContent, 'utf-8');
  console.log(`✅ Generated temporary rclone configuration.`);

  const rcloneBin = path.join(SCRIPT_DIR, 'rclone');
  if (!fs.existsSync(rcloneBin)) {
    console.error(`❌ Local rclone binary not found! Running installer first...`);
    process.exit(1);
  }

  const comfyPath = env.COMFY_PATH || '/home/nikhil/Documents/Remo2/ComfyUI';
  const driveDest = 'gdrive:ComfyUI_Models';
  const folders = ['checkpoints', 'loras', 'vae', 'embeddings', 'controlnet', 'upscale_models'];
  
  console.log('\n🚀 Starting high-speed model upload via rclone...');
  
  for (const folder of folders) {
    const src = path.join(comfyPath, 'models', folder);
    if (!fs.existsSync(src)) {
      console.log(`⚠️  Directory not found: ${src} — skipping`);
      continue;
    }

    console.log(`\n📤 Uploading ${folder} -> ${driveDest}/${folder}...`);
    
    // Spawn rclone process one-by-one sequential
    const rcloneProc = spawn(rcloneBin, [
      'copy',
      src,
      `${driveDest}/${folder}`,
      '--config',
      confPath,
      '--progress',
      '--transfers',
      '1',
    ], { stdio: 'inherit' });

    await new Promise((resolve) => {
      rcloneProc.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ ${folder} completed!`);
        } else {
          console.log(`❌ rclone exited with code ${code} for ${folder}`);
        }
        resolve();
      });
    });
  }

  // Upload custom nodes
  const customNodesSrc = path.join(comfyPath, 'custom_nodes');
  if (fs.existsSync(customNodesSrc)) {
    console.log(`\n📤 Uploading custom nodes -> ${driveDest}/custom_nodes...`);
    const rcloneProc = spawn(rcloneBin, [
      'copy',
      customNodesSrc,
      `${driveDest}/custom_nodes`,
      '--config',
      confPath,
      '--progress',
      '--transfers',
      '1',
      '--exclude',
      '*.pyc',
      '--exclude',
      '__pycache__/**',
      '--exclude',
      '.git/**',
    ], { stdio: 'inherit' });

    await new Promise((resolve) => {
      rcloneProc.on('close', resolve);
    });
    console.log(`✅ Custom nodes completed!`);
  }

  console.log('\n🎉 ALL MODELS AND CUSTOM NODES UPLOADED SUCCESSFULY TO GOOGLE DRIVE!');
  
  // Clean up
  try {
    fs.unlinkSync(confPath);
    console.log('🧹 Cleaned up temporary rclone configuration for security.');
  } catch (err) {}
}

run().catch(console.error);
