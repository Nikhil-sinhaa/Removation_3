// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Public routes: accessible to everyone (signed-in users auto-redirected away from sign-in/up by Clerk)
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhook(.*)",
  "/api/uploadthing(.*)",
  "/about",
  "/features",
  "/contact",
  "/blog(.*)",
  "/pricing",
  "/privacy",
  "/terms",
]);

// Protected routes: require login
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/projects(.*)",
  "/profile(.*)",
  "/settings(.*)",
  "/generate(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn } = await auth();

  // TEMPORARY: Skip all auth checks as requested
  // if (userId && (req.nextUrl.pathname.startsWith('/sign-in') || req.nextUrl.pathname.startsWith('/sign-up'))) {
  //   return NextResponse.redirect(new URL('/dashboard', req.url));
  // }

  // if (!userId && isProtectedRoute(req)) {
  //   return redirectToSignIn({ returnBackUrl: req.url });
  // }

  // 3. Allow all other requests to proceed
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};