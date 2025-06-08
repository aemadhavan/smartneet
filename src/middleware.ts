import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define public routes that don't require authentication
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
  "/api/subscription-plans(.*)",  // Make subscription plans API public
]);

// Apply middleware
export default clerkMiddleware(async (auth, req) => {
  // Skip middleware for static files and images
  if (req.nextUrl.pathname.startsWith('/_next') || 
      req.nextUrl.pathname.startsWith('/static') ||
      req.nextUrl.pathname.startsWith('/favicon.ico') ||
      req.nextUrl.pathname.startsWith('/images') ||
      req.nextUrl.pathname.startsWith('/.well-known')) {
    return;
  }

  // Handle 404s gracefully
  if (req.nextUrl.pathname === '/404') {
    return;
  }

  if (!publicRoutes(req)) {
    try {
      // Protect non-public routes
      await auth.protect();
    } catch (error) {
      console.error('Clerk middleware error:', error);
      
      // In production, redirect to sign-in if auth fails
      if (process.env.NODE_ENV === 'production') {
        const signInUrl = new URL('/sign-in', req.url);
        signInUrl.searchParams.set('redirect_url', req.url);
        return Response.redirect(signInUrl);
      }
      
      // In development, allow the request to continue but log the error
      console.warn('Auth failed in development mode:', error);
      return;
    }
  }
});

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    '/(api|trpc)(.*)'
  ],
};