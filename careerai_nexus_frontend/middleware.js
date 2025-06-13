import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

/**
 * PUBLIC_INTERFACE
 * Authentication enforcement middleware for Next.js App Router.
 * Redirects unauthenticated users to /sign-in for protected routes; allows access on public routes.
 *
 * Public routes include: '/', '/sign-in', '/sign-up', routes under '/api/public'.
 * For other routes, checks for NextAuth session token (JWT); if absent, redirects to /sign-in with callbackUrl.
 * Secure, production-ready: only reads JWT, does not touch DB; compatible with edge/functions.
 */

// PUBLIC_INTERFACE
export async function middleware(req) {
  // List of publicly accessible routes (add more as needed)
  const publicRoutes = [
    /^\/$/, // Home (root)
    /^\/sign-in$/,
    /^\/sign-up$/,
    /^\/api\/public(\/.*)?$/,
    /^\/favicon\.ico$/,
    /^\/_next\/.*$/,
    /^\/assets\/.*$/,
    /^\/api\/auth\/.*$/, // Let NextAuth own its own API routes!
  ];

  const { pathname } = req.nextUrl;

  // Allow public routes
  for (const regex of publicRoutes) {
    if (regex.test(pathname)) {
      return NextResponse.next();
    }
  }

  // Get JWT token from cookies (NextAuth v4+, stateless)
  // On Edge, getToken must use req as-is (not Response)
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (token) {
    // User authenticated: allow access.
    return NextResponse.next();
  }

  // Not authenticated: redirect to /sign-in with callbackUrl (unless already on /sign-in)
  const signInUrl = req.nextUrl.clone();
  signInUrl.pathname = "/sign-in";
  signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search);

  return NextResponse.redirect(signInUrl);
}

// PUBLIC_INTERFACE
export const config = {
  matcher: [
    /*
      Apply middleware to all routes under / (default), except static, _next, api/auth, and explicitly public ones above.
      Routes listed in the publicRoutes array will pass through; others (including all subpages, API routes, dashboard, etc.)
      will be checked for authentication.
    */
    "/((?!_next/|favicon.ico|sign-in|sign-up|api/public/|api/auth/|assets/).*)",
  ],
};
