import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

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
  // Add more public routes as needed
]);

// Apply middleware
export default clerkMiddleware(async (auth, req) => {
  // Skip static files and images
  if (
    req.nextUrl.pathname.startsWith('/_next') ||
    req.nextUrl.pathname.startsWith('/static') ||
    req.nextUrl.pathname.startsWith('/favicon.ico') ||
    req.nextUrl.pathname.startsWith('/images') ||
    req.nextUrl.pathname.startsWith('/.well-known')
  ) {
    return;
  }

  // Allow 404 page
  if (req.nextUrl.pathname === '/404') {
    return;
  }

  // If not a public route, require authentication
  if (!publicRoutes(req)) {
    try {
      await auth.protect();
    } catch {
      // Always redirect to sign-in if not authenticated
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return Response.redirect(signInUrl);
    }
  }
});

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    '/(api|trpc)(.*)'
  ],
};