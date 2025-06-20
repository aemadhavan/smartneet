import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// List all public routes here
const publicRoutes = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/about(.*)",
  "/privacy(.*)",
  "/terms(.*)",
  "/unsubscribe(.*)",
  "/api/waitlist(.*)",
  "/api/webhooks/stripe(.*)",
  "/smarter-guides(.*)",
  "/404",
  "/monitoring(.*)",
  "/pricing(.*)",
  "/api/subscription-plans(.*)",
  "/sitemap.xml",
  "/robots.txt",
  // Add more public routes as needed
]);

// Apply middleware
const middleware = async (auth: () => Promise<{ userId: string | null }>, req: NextRequest) => {
  // Skip static files and images
  if (
    req.nextUrl.pathname.startsWith('/_next') ||
    req.nextUrl.pathname.startsWith('/static') ||
    req.nextUrl.pathname.startsWith('/favicon.ico') ||
    req.nextUrl.pathname.startsWith('/images') ||
    req.nextUrl.pathname.startsWith('/.well-known') ||
    req.nextUrl.pathname.startsWith('/smarterneet-logo.jpeg') ||
    req.nextUrl.pathname.startsWith('/smarteneet.svg') ||
    req.nextUrl.pathname.startsWith('/sitemap.xml') ||
    req.nextUrl.pathname.startsWith('/robots.txt')
  ) {
    return;
  }

  // If not a public route, require authentication
  if (!publicRoutes(req)) {
    const { userId } = await auth();
    if (!userId) {
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return NextResponse.redirect(signInUrl);
    }
  }
};

export default clerkMiddleware(middleware);

export const config = {
  matcher: [
    // Match all routes except static files, images, and 404
    '/((?!_next/static|_next/image|favicon.ico|images|.well-known|404|smarterneet-logo.jpeg|smarteneet.svg|sitemap.xml|robots.txt).*)',
  ],
};