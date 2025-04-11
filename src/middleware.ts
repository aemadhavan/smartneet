/**
 * This file defines the middleware for the application.
 * It uses Clerk for authentication and authorization.
 */
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * This array defines the public routes that do not require authentication.
 */
const isPublic = createRouteMatcher([
  // Add protected routes here
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/privacy(.*)",
  "/terms(.*)",
  "/unsubscribe(.*)",
  "/api/waitlist(.*)"
]);

/**
 * This is the main middleware function that is executed for each request.
 * It checks if the route is public or protected and applies the necessary authentication.
 */
export default clerkMiddleware(async (auth,request)=>{
 if(!isPublic(request)){
     await auth.protect();
 }
});

/**
 * Configuration for the middleware.
 * It defines the matcher that specifies which routes the middleware should be applied to.
 */
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
