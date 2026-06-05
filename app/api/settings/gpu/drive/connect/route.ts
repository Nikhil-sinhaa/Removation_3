import { NextRequest, NextResponse } from 'next/server';
import { getAuthUrl } from '@/src/lib/googleDrive';

export const runtime = 'nodejs';

/** Redirect user to Google OAuth consent page. */
export async function GET(_req: NextRequest) {
  try {
    const url = getAuthUrl();
    return NextResponse.redirect(url);
  } catch (err: any) {
    // If credentials not set, show helpful error page
    const html = `<!DOCTYPE html>
<html style="background:#111;color:#fff;font-family:monospace;padding:2rem">
<h2>⚙️ Google Drive Setup Required</h2>
<p>Add these to your <code>.env.local</code> and restart the server:</p>
<pre style="background:#222;padding:1rem;border-radius:8px;line-height:1.8">
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
</pre>
<p>To get credentials:</p>
<ol>
  <li>Go to <a href="https://console.cloud.google.com/apis/credentials" style="color:#7c3aed">Google Cloud Console → Credentials</a></li>
  <li>Create OAuth 2.0 Client ID → Web Application</li>
  <li>Add Authorized redirect URI: <code>http://localhost:3000/api/settings/gpu/drive/callback</code></li>
  <li>Copy Client ID and Secret → paste in <code>.env.local</code></li>
  <li>Enable Google Drive API: <a href="https://console.cloud.google.com/apis/library/drive.googleapis.com" style="color:#7c3aed">Enable Drive API</a></li>
</ol>
<p><a href="/settings/gpu" style="color:#7c3aed">← Back to GPU Settings</a></p>
</html>`;
    return new Response(html, { status: 400, headers: { 'Content-Type': 'text/html' } });
  }
}
