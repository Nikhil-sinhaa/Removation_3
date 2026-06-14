/**
 * Google Drive helper — OAuth2 + upload utility
 * Uses GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET from .env.local
 */
import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';
import { Readable } from 'stream';
import { setSetting, getSetting } from '@/src/lib/appSettings';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const REDIRECT_URI =
  (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000') +
  '/api/settings/gpu/drive/callback';

export function getOAuth2Client() {
  const clientId     = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      'GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env.local. ' +
      'See: https://console.cloud.google.com/apis/credentials'
    );
  }

  return new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);
}

/** Generate the Google OAuth consent URL. */
export function getAuthUrl(): string {
  const oauth2 = getOAuth2Client();
  return oauth2.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // force refresh_token
  });
}

/** Exchange auth code for tokens and persist to DB. */
export async function handleCallback(code: string) {
  const oauth2 = getOAuth2Client();
  const { tokens } = await oauth2.getToken(code);
  await setSetting('GOOGLE_DRIVE_TOKENS', JSON.stringify(tokens));
  oauth2.setCredentials(tokens);
  return oauth2;
}

/** Load persisted tokens from DB. Returns null if not connected. */
export async function getAuthedClient() {
  const raw = await getSetting('GOOGLE_DRIVE_TOKENS');
  if (!raw) {
    console.warn('[Drive] Google Drive not connected (no tokens). Falling back to local mock drive client.');
    return { isMock: true } as any;
  }

  try {
    const tokens = JSON.parse(raw);
    const oauth2 = getOAuth2Client();
    oauth2.setCredentials(tokens);

    // Auto-refresh if expired
    oauth2.on('tokens', async (newTokens) => {
      const merged = { ...tokens, ...newTokens };
      await setSetting('GOOGLE_DRIVE_TOKENS', JSON.stringify(merged));
    });

    // Test token validity. If invalid_grant or other error occurs, this throws.
    await oauth2.getAccessToken();

    return oauth2;
  } catch (err: any) {
    console.warn('[Drive] Google Drive token verification failed (falling back to local mock drive client):', err.message);
    return { isMock: true } as any;
  }
}

/** Check if Drive is connected. */
export async function isDriveConnected(): Promise<boolean> {
  const client = await getAuthedClient();
  return client !== null && !client.isMock;
}

export const mockDrive = {
  files: {
    list: async (params: any) => {
      if (params?.q?.includes("mimeType='application/vnd.google-apps.folder'")) {
        return { data: { files: [{ id: 'mock-queue-folder-id', name: 'Removation_Handoff_Queue' }] } };
      }
      return { data: { files: [] } };
    },
    create: async (params: any) => {
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
          const chunks: any[] = [];
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
    get: async (params: any) => {
      const fileId = params.fileId;
      const mockDir = path.join(process.cwd(), 'tmp/drive_mock');
      const mockFilePath = path.join(mockDir, fileId);
      if (fs.existsSync(mockFilePath)) {
        const buffer = fs.readFileSync(mockFilePath);
        return { data: buffer };
      }
      throw new Error(`File ${fileId} not found in mock drive`);
    },
    delete: async (params: any) => {
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

export function getDriveService(authClient: any) {
  if (!authClient || authClient.isMock) {
    return mockDrive as any;
  }
  return google.drive({ version: 'v3', auth: authClient });
}

/** Disconnect Drive (clear tokens). */
export async function disconnectDrive() {
  await setSetting('GOOGLE_DRIVE_TOKENS', '');
}

// ─── Queue folder helper ─────────────────────────────────────────────────────

/**
 * Ensures the Removation_Handoff_Queue folder exists in Drive.
 * Caches the folder ID in AppSettings so it is only created once.
 * @param drive - authenticated Drive v3 client
 * @returns folder ID
 */
export async function ensureQueueFolder(
  drive: ReturnType<typeof google.drive>,
): Promise<string> {
  const cached = await getSetting('GOOGLE_DRIVE_QUEUE_FOLDER_ID');
  if (cached) return cached;

  const folderId = await ensureDriveFolder(drive, 'Removation_Handoff_Queue');
  await setSetting('GOOGLE_DRIVE_QUEUE_FOLDER_ID', folderId);
  console.log('[Drive] Created Removation_Handoff_Queue folder:', folderId);
  return folderId;
}

// ─── File transfer helpers ────────────────────────────────────────────────────

/**
 * Download a Drive file by ID and return its content as a Buffer.
 */
export async function downloadFileFromDrive(
  drive: ReturnType<typeof google.drive>,
  fileId: string,
): Promise<Buffer> {
  const res = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' },
  );
  return Buffer.from(res.data as ArrayBuffer);
}

/**
 * Upload a Buffer to Drive (no temp file needed).
 * Returns the Drive file ID of the newly created file.
 */
export async function uploadBuffer(
  drive: ReturnType<typeof google.drive>,
  buffer: Buffer,
  fileName: string,
  folderId: string,
): Promise<string> {
  const stream = Readable.from(buffer);
  const created = await drive.files.create({
    requestBody: { name: fileName, parents: [folderId] },
    media: {
      mimeType: 'application/octet-stream',
      body: stream,
    },
    fields: 'id',
  });
  return created.data.id!;
}

// ─── Upload helpers ───────────────────────────────────────────────────────────

interface UploadProgress {
  file: string;
  folder: string;
  bytesSent: number;
  totalBytes: number;
  percent: number;
  done: boolean;
  error?: string;
}

// Global upload state (in-process, survives for the duration of upload)
declare global {
  // eslint-disable-next-line no-var
  var __driveUploadProgress: UploadProgress[] | null;
  // eslint-disable-next-line no-var
  var __driveUploadRunning: boolean;
}

export function getUploadProgress(): UploadProgress[] | null {
  return globalThis.__driveUploadProgress ?? null;
}

export function isUploadRunning(): boolean {
  return globalThis.__driveUploadRunning ?? false;
}

/** Get or create a folder in Drive, returns folder ID. */
async function ensureDriveFolder(
  drive: ReturnType<typeof google.drive>,
  name: string,
  parentId?: string
): Promise<string> {
  const query = [
    `name='${name}'`,
    `mimeType='application/vnd.google-apps.folder'`,
    `trashed=false`,
    parentId ? `'${parentId}' in parents` : '',
  ].filter(Boolean).join(' and ');

  const res = await drive.files.list({ q: query, fields: 'files(id, name)', spaces: 'drive' });
  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id!;
  }

  const created = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : [],
    },
    fields: 'id',
  });
  return created.data.id!;
}

/** Upload a single file to Drive using resumable upload with progress. */
async function uploadFile(
  drive: ReturnType<typeof google.drive>,
  filePath: string,
  fileName: string,
  folderId: string,
  onProgress: (bytes: number, total: number) => void
): Promise<void> {
  const stats    = fs.statSync(filePath);
  const fileSize = stats.size;
  const stream   = fs.createReadStream(filePath);

  // Check if file already exists in that folder (skip if same size)
  const existing = await drive.files.list({
    q: `name='${fileName}' and '${folderId}' in parents and trashed=false`,
    fields: 'files(id, size)',
    spaces: 'drive',
  });
  if (existing.data.files && existing.data.files.length > 0) {
    const remoteSize = Number(existing.data.files[0].size ?? 0);
    if (remoteSize === fileSize) {
      // Already uploaded, skip
      onProgress(fileSize, fileSize);
      return;
    }
    // Different size — delete and re-upload
    await drive.files.delete({ fileId: existing.data.files[0].id! });
  }

  await drive.files.create(
    {
      requestBody: { name: fileName, parents: [folderId] },
      media: {
        mimeType: 'application/octet-stream',
        body: stream,
      },
    },
    {
      onUploadProgress: (evt) => {
        onProgress(evt.bytesRead, fileSize);
      },
    }
  );
}

/** Recursively collect all files under a directory. */
function collectFiles(dir: string): { full: string; relative: string }[] {
  const result: { full: string; relative: string }[] = [];
  if (!fs.existsSync(dir)) return result;

  function walk(current: string, rel: string) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      if (entry.name === '__pycache__') continue;
      if (entry.name.endsWith('.pyc')) continue;
      const fullPath = path.join(current, entry.name);
      const relPath  = path.join(rel, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath, relPath);
      } else {
        result.push({ full: fullPath, relative: relPath });
      }
    }
  }

  walk(dir, '');
  return result;
}

/**
 * Start uploading ComfyUI models to Google Drive in the background.
 * Progress is tracked in globalThis.__driveUploadProgress.
 */
export async function startModelUpload() {
  if (globalThis.__driveUploadRunning) {
    throw new Error('Upload already in progress');
  }

  const client = await getAuthedClient();
  if (!client) throw new Error('Not connected to Google Drive');

  const COMFYUI_PATH =
    process.env.COMFY_PATH ?? '/home/nikhil/Documents/Remo2/ComfyUI';

  const MODEL_DIRS = [
    'checkpoints', 'loras', 'vae', 'embeddings',
    'controlnet', 'upscale_models', 'ipadapter', 'clip', 'unet',
  ];

  // Collect all files
  const allFiles: { full: string; relative: string; folder: string }[] = [];
  for (const folderName of MODEL_DIRS) {
    const dir   = path.join(COMFYUI_PATH, 'models', folderName);
    const files = collectFiles(dir);
    for (const f of files) {
      allFiles.push({ ...f, folder: folderName });
    }
  }

  globalThis.__driveUploadProgress = allFiles.map(f => ({
    file:       f.relative,
    folder:     f.folder,
    bytesSent:  0,
    totalBytes: fs.existsSync(f.full) ? fs.statSync(f.full).size : 0,
    percent:    0,
    done:       false,
  }));
  globalThis.__driveUploadRunning = true;

  // Run upload async (fire and forget from API perspective)
  (async () => {
    try {
      const drive = google.drive({ version: 'v3', auth: client });

      // Ensure root folder
      const rootId = await ensureDriveFolder(drive, 'ComfyUI_Models');

      // Cache sub-folder IDs
      const folderIds: Record<string, string> = {};
      for (const folderName of MODEL_DIRS) {
        folderIds[folderName] = await ensureDriveFolder(drive, folderName, rootId);
      }

      for (let i = 0; i < allFiles.length; i++) {
        const f       = allFiles[i];
        const prog    = globalThis.__driveUploadProgress![i];
        const folderId = folderIds[f.folder];

        try {
          await uploadFile(
            drive,
            f.full,
            path.basename(f.relative),
            folderId,
            (sent, total) => {
              prog.bytesSent  = sent;
              prog.totalBytes = total;
              prog.percent    = total > 0 ? Math.round((sent / total) * 100) : 0;
            }
          );
          prog.done    = true;
          prog.percent = 100;
        } catch (err: any) {
          prog.error = err.message;
          prog.done  = true;
        }
      }
    } catch (err: any) {
      console.error('[Drive] Upload failed:', err.message);
    } finally {
      globalThis.__driveUploadRunning = false;
    }
  })();
}
