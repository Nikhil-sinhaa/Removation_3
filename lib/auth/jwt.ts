import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const COOKIE_NAME = process.env.COOKIE_NAME || 'auth_token';
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JwtPayload {
  id: string;
  email: string;
}

export interface ResetTokenPayload {
  id: string;
  purpose: 'password-reset';
}

/** Sign a JWT and set it as an HttpOnly cookie on the response */
export function issueJwt(res: NextResponse, user: { _id: string; email: string }): void {
  const token = jwt.sign(
    { id: user._id.toString(), email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN as any }
  );

  const isProduction = process.env.NODE_ENV === 'production';

  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    path: '/',
  });
}

/** Verify a JWT and return the payload, or null if invalid */
export function verifyJwt(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

/** Get the current user from the auth cookie in a Server Component / API Route */
export async function getCurrentUser(): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyJwt(token);
}

/** Sign a short-lived reset token (15 minutes) */
export function signResetToken(userId: string): string {
  return jwt.sign(
    { id: userId, purpose: 'password-reset' },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
}

/** Verify and decode a reset token */
export function verifyResetToken(token: string): ResetTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as ResetTokenPayload;
    if (decoded.purpose !== 'password-reset') return null;
    return decoded;
  } catch {
    return null;
  }
}

export { COOKIE_NAME };
