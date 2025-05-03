import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
 
// Define public routes that don't require authentication
const publicRoutes = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/privacy(.*)",
  "/terms(.*)",
  "/unsubscribe(.*)",
  "/api/waitlist(.*)",
  "/api/webhooks/stripe(.*)"
]);

// Apply middleware
export default clerkMiddleware(async (auth, req) => {
  if (!publicRoutes(req)) {
    // Protect non-public routes
    await auth.protect();
  }
});
 
export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};