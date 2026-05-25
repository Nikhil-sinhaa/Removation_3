import { NextRequest, NextResponse } from 'next/server';
import { handleCallback } from '@/src/lib/googleDrive';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code  = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      new URL(`/settings/gpu?drive_error=${encodeURIComponent(error)}`, req.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(new URL('/settings/gpu?drive_error=no_code', req.url));
  }

  try {
    await handleCallback(code);
    return NextResponse.redirect(new URL('/settings/gpu?drive_connected=1', req.url));
  } catch (err: any) {
    console.error('[Drive OAuth] callback error:', err.message);
    return NextResponse.redirect(
      new URL(`/settings/gpu?drive_error=${encodeURIComponent(err.message)}`, req.url)
    );
  }
}
