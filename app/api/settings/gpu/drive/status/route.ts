import { NextResponse } from 'next/server';
import { getAuthUrl, isDriveConnected } from '@/src/lib/googleDrive';
import { isUploadRunning, getUploadProgress } from '@/src/lib/googleDrive';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const connected = await isDriveConnected();
    const running   = isUploadRunning();
    const progress  = getUploadProgress();

    // Summary stats
    let summary = null;
    if (progress) {
      const total    = progress.length;
      const done     = progress.filter(p => p.done).length;
      const errors   = progress.filter(p => p.done && p.error).length;
      const totalGB  = progress.reduce((s, p) => s + p.totalBytes, 0) / 1e9;
      const sentGB   = progress.reduce((s, p) => s + p.bytesSent,  0) / 1e9;
      summary = { total, done, errors, totalGB, sentGB, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
    }

    const authUrl = connected ? null : getAuthUrl();

    return NextResponse.json({ connected, running, summary, authUrl });
  } catch (err: any) {
    // If Google credentials not configured yet
    if (err.message.includes('GOOGLE_CLIENT_ID')) {
      return NextResponse.json({
        connected: false,
        running: false,
        summary: null,
        authUrl: null,
        credsMissing: true,
        message: err.message,
      });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
