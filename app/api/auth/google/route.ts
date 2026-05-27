import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { isSafeRedirectPath } from '@/lib/auth/safeRedirect';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawRedirect = searchParams.get('redirect_url');

  // Validate the redirect_url before encoding into state.
  // If missing or invalid, fall back to '/' — the flow still continues cleanly.
  const safeRedirect = isSafeRedirectPath(rawRedirect) ? rawRedirect : '/';

  // Build state JWT: CSRF token + safe redirect path, signed, 5-minute expiry.
  // This is passed to Google and verified in the callback to prevent CSRF
  // and to carry the redirect destination through the round-trip.
  const csrf = crypto.randomBytes(16).toString('hex');
  const stateToken = jwt.sign(
    { csrf, redirect: safeRedirect },
    JWT_SECRET,
    { expiresIn: '5m' }
  );

  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const options = {
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/callback`,
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ].join(' '),
    state: stateToken,
  };

  // URLSearchParams handles URL-encoding of the state JWT automatically.
  const qs = new URLSearchParams(options);
  const redirectUrl = `${rootUrl}?${qs.toString()}`;

  return NextResponse.redirect(redirectUrl);
}
