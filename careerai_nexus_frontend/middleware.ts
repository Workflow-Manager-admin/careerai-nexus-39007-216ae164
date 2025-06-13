import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// PUBLIC_INTERFACE
// Enforces Clerk authentication for protected routes per the Clerk App Router Quickstart.
export default clerkMiddleware({
  // Customize as needed. By default, all routes are protected except for
  // static files and Clerk/public routes.
  publicRoutes: [
    "/", "/signin", "/signup",
    "/favicon.ico", "/_next/static/*", "/_next/image*", "/api/public/*"
  ],
});

// PUBLIC_INTERFACE
export const config = {
  // See: https://clerk.com/docs/references/nextjs/middleware#matcher
  matcher: [
    /*
      Match all routes except for static assets and public routes.
      Clerk will check authentication where needed; publicRoutes parameter above is recommended way.
    */
    "/((?!_next/|favicon.ico|signin|signup|api/public/).*)",
  ],
};
