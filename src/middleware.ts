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
  "/404"
]);

// Apply middleware
export default clerkMiddleware(async (auth, req) => {
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
      throw error;
    }
  }
});

export const config = {
  matcher: [
    // '/((?!.*\\..*|_next).*)',
    // '/',
    // '/(api|trpc)(.*)'
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    '/(api|trpc)(.*)'
  ],
};