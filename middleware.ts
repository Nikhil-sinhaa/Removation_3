import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Paths that never require authentication
const PUBLIC_PREFIXES = [
  '/',
  '/about',
  '/pricing',
  '/features',
  '/contact',
  '/blog',
  '/privacy',
  '/terms',
  '/sign-in',
  '/sign-up',
  '/verify-otp',
  '/forgot-password',
  '/reset-password',
  '/generate',
  '/api/webhook',
  '/api/webhooks',
  '/api/uploadthing',
  '/api/auth',
  '/api/stats/public',
  '/api/designers',
  '/api/contractors',
  '/api/vendors',
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    p => pathname === p || (p !== '/' && pathname.startsWith(p + '/')) || pathname.startsWith(p + '?'),
  );
}

const COOKIE_NAME = process.env.COOKIE_NAME || 'auth_token';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Dev escape hatch — must be explicitly set and only works outside production
  if (process.env.SKIP_AUTH === 'true' && process.env.NODE_ENV !== 'production') {
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Verify JWT signature and expiry using jose (Edge Runtime compatible)
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch {
    // Token is expired or tampered — clear cookie and redirect
    const res = pathname.startsWith('/api/')
      ? NextResponse.json({ error: 'Token expired or invalid' }, { status: 401 })
      : (() => {
          const signInUrl = new URL('/sign-in', req.url);
          signInUrl.searchParams.set('redirect_url', pathname);
          return NextResponse.redirect(signInUrl);
        })();
    res.cookies.delete(COOKIE_NAME);
    return res;
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|manifest.webmanifest|robots.txt|sitemap.xml|images|icons|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp|.*\\.ico|.*\\.txt|.*\\.xml).*)',
  ],
};