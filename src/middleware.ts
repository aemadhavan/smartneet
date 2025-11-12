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
  "/biology(.*)",
  "/chemistry(.*)",
  "/sitemap.xml",
  "/robots.txt",
  // Add more public routes as needed
]);

// Pre-compile static paths for faster matching
const STATIC_PATHS = new Set([
  '/_next',
  '/static',
  '/favicon.ico',
  '/images',
  '/.well-known',
  '/smarterneet-logo.jpeg',
  '/smarteneet.svg',
  '/sitemap.xml',
  '/robots.txt'
]);

const IMAGE_EXTENSIONS = new Set(['.webp', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico']);

const ALLOWED_MOBILE_APIS = new Set([
  '/api/subjects',
  '/api/topics',
  '/api/subtopics',
  '/api/questions',
  '/api/practice-sessions',
  '/api/question-attempts',
  '/api/subscription-plans',
  '/api/question-types',
  '/api/user-stats',
  '/api/topic-mastery',
  '/api/session-questions'
]);

// Apply middleware
const middleware = async (auth: () => Promise<{ userId: string | null }>, req: NextRequest) => {
  const pathname = req.nextUrl.pathname;

  // Fast path: Skip static files and images using optimized checks
  // Check static paths first (most common)
  for (const path of STATIC_PATHS) {
    if (pathname.startsWith(path)) {
      return;
    }
  }

  // Check image extensions
  const lastDot = pathname.lastIndexOf('.');
  if (lastDot !== -1) {
    const ext = pathname.slice(lastDot);
    if (IMAGE_EXTENSIONS.has(ext)) {
      return;
    }
  }

  // Check if request is from mobile app (only get headers once)
  const userAgent = req.headers.get('user-agent');
  const clientId = req.headers.get('x-client-id');

  const isMobileApp = (userAgent && (userAgent.includes('SmarterNEET-Mobile') || userAgent.includes('Mobile'))) ||
                      (clientId && clientId.startsWith('flutter-'));

  // If API request from mobile app, allow certain endpoints
  if (isMobileApp && pathname.startsWith('/api/')) {
    for (const api of ALLOWED_MOBILE_APIS) {
      if (pathname.startsWith(api)) {
        return; // Allow without auth
      }
    }
  }

  // Create response to add headers
  const response = NextResponse.next();

  // Add performance and security headers
  const headers = response.headers;

  // Security Headers
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://vercel.live https://va.vercel-scripts.com https://*.clerk.accounts.dev https://*.clerk.com https://www.clarity.ms https://scripts.clarity.ms",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.clerk.accounts.dev",
    "font-src 'self' https://fonts.gstatic.com https://r2cdn.perplexity.ai https://*.clerk.accounts.dev data:",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://www.google-analytics.com https://vitals.vercel-insights.com https://clerk.smarterneet.com https://*.clerk.accounts.dev https://*.clerk.com wss://*.clerk.accounts.dev https://www.clarity.ms https://*.clarity.ms https://*.ingest.us.sentry.io https://*.sentry.io",
    "frame-src 'self' https://www.googletagmanager.com https://challenges.cloudflare.com https://*.clerk.accounts.dev",
    "worker-src 'self' blob:",
    "media-src 'self' blob: data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ');

  headers.set('Content-Security-Policy', csp);

  // Cache-Control headers for different content types
  // Note: pathname already declared at line 59

  // Static assets - long cache with immutable
  if (pathname.startsWith('/_next/static/')) {
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  // API routes - no cache with proper directives
  else if (pathname.startsWith('/api/')) {
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
  }
  // Chemistry/Biology pages - with stale-while-revalidate
  else if (pathname.startsWith('/chemistry') || pathname.startsWith('/biology')) {
    headers.set('Cache-Control', 'public, max-age=0, must-revalidate, stale-while-revalidate=3600');
  }
  // Other pages - with revalidation
  else {
    headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
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

  return response;
};

export default clerkMiddleware(middleware);

export const config = {
  matcher: [
    // Match all routes except static files, images, and 404
    '/((?!_next/static|_next/image|favicon.ico|images|.well-known|404|smarterneet-logo.jpeg|smarteneet.svg|sitemap.xml|robots.txt|.*\\.webp|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.ico).*)',
  ],
};