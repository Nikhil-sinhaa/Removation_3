import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = [
  '/',
  '/generate',
  '/about',
  '/pricing',
  '/sign-in',
  '/sign-up',
  '/verify-otp',
  '/forgot-password',
  '/reset-password',
  '/features',
  '/contact',
  '/blog',
  '/privacy',
  '/terms',
  '/api/webhook',
  '/api/uploadthing',
  '/api/auth'
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only allow SKIP_AUTH bypass in non-production
  const skipAuth = process.env.SKIP_AUTH === 'true' 
    && process.env.NODE_ENV !== 'production';

  if (skipAuth) {
    return NextResponse.next();
  }

  // Check if route is public
  const isPublicRoute = publicPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check for auth cookie
  const token = req.cookies.get(process.env.COOKIE_NAME || 'auth_token')?.value;

  if (!token) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/
     * - icons/
     */
    '/((?!_next/static|_next/image|favicon.ico|images|icons|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp).*)',
  ],
};