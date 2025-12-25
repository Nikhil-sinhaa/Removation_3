import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
  "/_next(.*)",
  "/favicon.ico",
  "/manifest.json",
  "/sw.js",
  "/images(.*)",
  "/icons(.*)",
]);

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { userId, sessionClaims } = await auth();

  // Allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Check authentication for protected routes
  if (!userId) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }

  // Check admin access
  if (isAdminRoute(req)) {
    const userRole = (sessionClaims?.metadata as { role?: string })?.role;
    if (userRole !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // Add user info to headers for API routes
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-user-id", userId);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};