import { NextResponse } from 'next/server';
import { getAuthedClient } from '@/src/lib/googleDrive';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

/**
 * Upload the RemovationColab.ipynb notebook to Google Drive root
 * so the user can open it directly in Colab.
 */
export async function POST() {
  try {
    const client = await getAuthedClient();
    if (!client) {
      return NextResponse.json({ error: 'Not connected to Google Drive' }, { status: 401 });
    }

    const drive        = google.drive({ version: 'v3', auth: client });
    const notebookPath = path.join(process.cwd(), 'scripts', 'RemovationColab.ipynb');

    if (!fs.existsSync(notebookPath)) {
      return NextResponse.json({ error: 'Notebook not found at scripts/RemovationColab.ipynb' }, { status: 404 });
    }

    const NOTEBOOK_NAME = 'RemovationColab.ipynb';

    // Remove existing copy if present
    const existing = await drive.files.list({
      q: `name='${NOTEBOOK_NAME}' and trashed=false`,
      fields: 'files(id)',
      spaces: 'drive',
    });
    for (const f of existing.data.files ?? []) {
      await drive.files.delete({ fileId: f.id! });
    }

    // Upload fresh copy
    const res = await drive.files.create({
      requestBody: { name: NOTEBOOK_NAME },
      media: {
        mimeType: 'application/octet-stream',
        body:     fs.createReadStream(notebookPath),
      },
      fields: 'id, webViewLink',
    });

    const fileId      = res.data.id!;
    const webViewLink = res.data.webViewLink!;

    // Make it openable by the Drive owner without extra sharing
    const colabUrl = `https://colab.research.google.com/drive/${fileId}`;

    return NextResponse.json({ success: true, fileId, webViewLink, colabUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
