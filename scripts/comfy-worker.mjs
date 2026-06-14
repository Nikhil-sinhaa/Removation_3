/**
 * scripts/comfy-worker.mjs
 *
 * Local GPU worker daemon for the Vastu async pipeline.
 *
 * Polls POST /api/ai/jobs/poll every WORKER_POLL_INTERVAL_MS (default: 5000 ms).
 * On receiving a job:
 *   1. Downloads the input image Buffer from Google Drive.
 *   2. Writes it to ComfyUI/input/ (same naming convention as saveImageForComfy).
 *   3. Calls detectVastuElements() — the SAME function used by /api/vastu.
 *   4. Heartbeats every 30 s while ComfyUI runs.
 *   5. Reads the 8 output mask files from ComfyUI/output/vastu_detect/.
 *   6. Uploads each mask to Google Drive (queue folder).
 *   7. POSTs /complete with Drive file IDs, or /fail on error.
 *
 * Run with: npm run worker:vastu
 * Or directly: node scripts/comfy-worker.mjs
 *
 * Required env vars (can be set in .env.local — Node reads it via --env-file
 * or you can export them manually):
 *   WORKER_SECRET        — shared secret, must match server WORKER_SECRET
 *   NEXT_PUBLIC_APP_URL  — e.g. http://localhost:3000
 *   MONGODB_URI          — Atlas URI (same as app)
 *   GOOGLE_CLIENT_ID     — Google OAuth client
 *   GOOGLE_CLIENT_SECRET
 *   COMFY_INPUT          — default: /home/nikhil/Documents/Remo2/ComfyUI/input
 *   COMFY_OUTPUT         — default: /home/nikhil/Documents/Remo2/ComfyUI/output
 *   COMFY_PATH           — default: /home/nikhil/Documents/Remo2/ComfyUI
 */

// import 'dotenv/config';  // loads .env.local via dotenv if present
import path from 'path';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { google } from 'googleapis';

// ── Configuration ─────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS     = parseInt(process.env.WORKER_POLL_INTERVAL_MS || '5000', 10);
const HEARTBEAT_INTERVAL_MS = 30_000;
const WORKER_ID            = `worker-${process.pid}-${Date.now()}`;
const BASE_URL             = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const WORKER_SECRET        = process.env.WORKER_SECRET;
const COMFY_INPUT          = process.env.COMFY_INPUT  || '/home/nikhil/Documents/Remo2/ComfyUI/input';
const COMFY_OUTPUT         = process.env.COMFY_OUTPUT || '/home/nikhil/Documents/Remo2/ComfyUI/output';

if (!WORKER_SECRET) {
  console.error('❌ WORKER_SECRET env var is required. Add it to .env.local.');
  process.exit(1);
}

const HEADERS = {
  'Content-Type': 'application/json',
  'x-worker-secret': WORKER_SECRET,
};

// ── API helpers ───────────────────────────────────────────────────────────────

async function apiPost(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${path} failed ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

// ── Google Drive helpers ──────────────────────────────────────────────────────

async function getAppSettingsModel() {
  const mongoose = await import('mongoose');
  const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (!MONGODB_URI) throw new Error('MONGODB_URI not set');

  if (mongoose.default.connection.readyState === 0) {
    await mongoose.default.connect(MONGODB_URI, { bufferCommands: false });
    console.log('[Worker] MongoDB connected');
  }

  const { default: AppSettingsModel } = await import('../src/models/AppSettings.js');
  return AppSettingsModel;
}

async function getDriveClient() {
  try {
    const AppSettingsModel = await getAppSettingsModel();
    const doc = await AppSettingsModel.findOne({ key: 'GOOGLE_DRIVE_TOKENS' }).lean();
    if (!doc?.value) throw new Error('Google Drive not connected — run OAuth flow first');

    const tokens = JSON.parse(doc.value);
    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000') + '/api/settings/gpu/drive/callback',
    );
    oauth2.setCredentials(tokens);
    
    // Check if the credentials are valid
    await oauth2.getAccessToken();

    return google.drive({ version: 'v3', auth: oauth2 });
  } catch (err) {
    console.warn('[Worker] Google Drive auth failed, falling back to local mock drive client:', err.message);
    const fs = await import('fs');
    const path = await import('path');
    return {
      files: {
        list: async (params) => {
          if (params?.q?.includes("mimeType='application/vnd.google-apps.folder'")) {
            return { data: { files: [{ id: 'mock-queue-folder-id', name: 'Removation_Handoff_Queue' }] } };
          }
          return { data: { files: [] } };
        },
        create: async (params) => {
          const name = params.requestBody?.name || 'unknown';
          const fileId = `mock-drive-id-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          const mockDir = path.join(process.cwd(), 'tmp/drive_mock');
          if (!fs.existsSync(mockDir)) {
            fs.mkdirSync(mockDir, { recursive: true });
          }
          const mockFilePath = path.join(mockDir, fileId);

          const body = params.media?.body;
          if (body) {
            if (typeof body.pipe === 'function' || typeof body[Symbol.asyncIterator] === 'function') {
              const chunks = [];
              for await (const chunk of body) {
                chunks.push(chunk);
              }
              fs.writeFileSync(mockFilePath, Buffer.concat(chunks));
            } else {
              fs.writeFileSync(mockFilePath, body);
            }
          } else {
            fs.writeFileSync(mockFilePath, '');
          }
          return { data: { id: fileId } };
        },
        get: async (params) => {
          const fileId = params.fileId;
          const mockDir = path.join(process.cwd(), 'tmp/drive_mock');
          const mockFilePath = path.join(mockDir, fileId);
          if (fs.existsSync(mockFilePath)) {
            const buffer = fs.readFileSync(mockFilePath);
            return { data: buffer };
          }
          throw new Error(`File ${fileId} not found in mock drive`);
        },
        delete: async (params) => {
          const fileId = params.fileId;
          const mockDir = path.join(process.cwd(), 'tmp/drive_mock');
          const mockFilePath = path.join(mockDir, fileId);
          if (fs.existsSync(mockFilePath)) {
            fs.unlinkSync(mockFilePath);
          }
          return { data: {} };
        }
      }
    };
  }
}

async function downloadFromDrive(drive, fileId) {
  const res = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' },
  );
  return Buffer.from(res.data);
}

async function uploadBufferToDrive(drive, buffer, fileName, folderId) {
  const { Readable } = await import('stream');
  const stream = Readable.from(buffer);
  const created = await drive.files.create({
    requestBody: { name: fileName, parents: [folderId] },
    media: { mimeType: 'application/octet-stream', body: stream },
    fields: 'id',
  });
  return created.data.id;
}

async function getQueueFolderId(drive) {
  const AppSettingsModel = await getAppSettingsModel();
  const doc = await AppSettingsModel.findOne({ key: 'GOOGLE_DRIVE_QUEUE_FOLDER_ID' }).lean();
  if (doc?.value) return doc.value;

  // Create folder if missing
  const res = await drive.files.list({
    q: `name='Removation_Handoff_Queue' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id)',
    spaces: 'drive',
  });
  if (res.data.files?.length > 0) return res.data.files[0].id;

  const created = await drive.files.create({
    requestBody: {
      name: 'Removation_Handoff_Queue',
      mimeType: 'application/vnd.google-apps.folder',
    },
    fields: 'id',
  });
  return created.data.id;
}

// ── Pass name → output file path helper ──────────────────────────────────────

// Mirrors vastuDetectionBuilder.js: SaveImage filename_prefix = `vastu_detect/${pass.passName}_mask`
// ComfyUI appends _00001_.png by default.
const PASS_NAMES = [
  'bed', 'stove_sink', 'mirror', 'door', 'toilet',
  'idol_temple', 'plant', 'aquarium_fountain',
];

function getMaskCandidates(passName) {
  const base = path.join(COMFY_OUTPUT, 'vastu_detect');
  return [
    path.join(base, `${passName}_mask_00001_.png`),
    path.join(base, `${passName}_mask_00002_.png`),
    path.join(base, `${passName}_mask.png`),
  ];
}

async function readMaskFile(passName) {
  for (const candidate of getMaskCandidates(passName)) {
    try {
      return { buffer: await readFile(candidate), path: candidate };
    } catch { /* try next */ }
  }
  throw new Error(`Could not find mask file for pass '${passName}' in ${COMFY_OUTPUT}/vastu_detect/`);
}

// ── Main job runner ───────────────────────────────────────────────────────────

async function processJob(job, drive, queueFolderId) {
  const { jobId, inputs, params } = job;
  const { driveFileId, fileName } = inputs.originalImage;

  console.log(`\n[Worker] ── Processing job ${jobId} ──`);
  console.log(`[Worker] Input: ${fileName} (${driveFileId})`);
  console.log(`[Worker] Params: ${JSON.stringify(params)}`);

  const t0 = Date.now();

  // 1. Mark as processing
  // (lease was set in poll; we just log)

  // 2. Download input image from Drive
  console.log('[Worker] Downloading input image from Drive…');
  const imageBuffer = await downloadFromDrive(drive, driveFileId);

  // 3. Write to ComfyUI/input/ — use the same naming pattern as saveImageForComfy
  await mkdir(COMFY_INPUT, { recursive: true });
  const comfyFilename = `vastu_input_job_${jobId}_${fileName}`;
  const comfyInputPath = path.join(COMFY_INPUT, comfyFilename);
  await writeFile(comfyInputPath, imageBuffer);
  console.log(`[Worker] Wrote to ComfyUI input: ${comfyFilename}`);

  // 4. Import and run the Vastu detection orchestrator
  //    We import dynamically to avoid ESM/CJS conflicts at module load time.
  const { detectVastuElements } = await import('../src/services/vastuDetectionOrchestrator.js');

  console.log('[Worker] Running detectVastuElements (8-pass ComfyUI)…');
  // detectVastuElements returns [] on failure — we still proceed to upload whatever masks exist
  const detectedElements = await detectVastuElements(comfyFilename, {
    roomType: params.roomType,
  });
  console.log(`[Worker] Detection complete: ${detectedElements.length} element(s) in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

  // 5. Upload each mask file to Drive
  console.log('[Worker] Uploading 8 mask outputs to Drive…');
  const outputs = {};

  for (const passName of PASS_NAMES) {
    try {
      const { buffer: maskBuffer, path: maskPath } = await readMaskFile(passName);
      const maskFileName = `job_${jobId}_${passName}_mask.png`;
      const maskDriveId = await uploadBufferToDrive(drive, maskBuffer, maskFileName, queueFolderId);
      outputs[passName] = { driveFileId: maskDriveId, fileName: maskFileName };
      console.log(`  ✓ ${passName}: ${maskDriveId}`);
    } catch (err) {
      // Non-fatal — pass had no detections (blank mask or ComfyUI skipped it)
      console.warn(`  ⚠ ${passName}: ${err.message}`);
    }
  }

  return outputs;
}

// ── Poll loop ─────────────────────────────────────────────────────────────────

async function runWorker() {
  console.log(`\n🚀 Vastu GPU worker started (id: ${WORKER_ID})`);
  console.log(`   Polling ${BASE_URL}/api/ai/jobs/poll every ${POLL_INTERVAL_MS}ms\n`);

  let drive;
  let queueFolderId;

  try {
    drive = await getDriveClient();
    queueFolderId = await getQueueFolderId(drive);
    console.log(`[Worker] Drive ready. Queue folder: ${queueFolderId}`);
  } catch (err) {
    console.error('[Worker] Drive init failed:', err.message);
    process.exit(1);
  }

  let running = true;
  process.on('SIGINT', () => { running = false; console.log('\n[Worker] Stopping…'); });
  process.on('SIGTERM', () => { running = false; });

  while (running) {
    let job;
    try {
      const data = await apiPost('/api/ai/jobs/poll', { workerId: WORKER_ID });
      if (!data.jobId) {
        // No jobs — wait and poll again
        await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
        continue;
      }
      job = data;
      console.log(`[Worker] Leased job ${job.jobId}`);
    } catch (err) {
      console.warn('[Worker] Poll error:', err.message);
      await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
      continue;
    }

    // Start heartbeat
    let heartbeatTimer = setInterval(async () => {
      try {
        await apiPost(`/api/ai/jobs/${job.jobId}/heartbeat`, { workerId: WORKER_ID });
      } catch (err) {
        console.warn('[Worker] Heartbeat failed:', err.message);
      }
    }, HEARTBEAT_INTERVAL_MS);

    try {
      const outputs = await processJob(job, drive, queueFolderId);
      clearInterval(heartbeatTimer);

      await apiPost(`/api/ai/jobs/${job.jobId}/complete`, {
        workerId: WORKER_ID,
        outputs,
      });

      console.log(`[Worker] ✅ Job ${job.jobId} completed`);
    } catch (err) {
      clearInterval(heartbeatTimer);
      console.error(`[Worker] ❌ Job ${job.jobId} failed:`, err.message);

      try {
        await apiPost(`/api/ai/jobs/${job.jobId}/fail`, {
          workerId: WORKER_ID,
          error: err.message,
        });
      } catch (failErr) {
        console.error('[Worker] Could not report failure:', failErr.message);
      }
    }

    // Brief pause before next poll
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('[Worker] Exited cleanly.');
  process.exit(0);
}

runWorker().catch(err => {
  console.error('[Worker] Fatal:', err);
  process.exit(1);
});
