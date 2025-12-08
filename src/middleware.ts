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

/**
 * Check if the request is for a static file or image
 */
function isStaticFile(pathname: string): boolean {
  // Check static paths first (most common)
  for (const path of STATIC_PATHS) {
    if (pathname.startsWith(path)) {
      return true;
    }
  }

  // Check image extensions
  const lastDot = pathname.lastIndexOf('.');
  if (lastDot !== -1) {
    const ext = pathname.slice(lastDot);
    if (IMAGE_EXTENSIONS.has(ext)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if the request is from mobile app and accessing allowed APIs
 */
function isMobileApiRequest(req: NextRequest, pathname: string): boolean {
  const userAgent = req.headers.get('user-agent');
  const clientId = req.headers.get('x-client-id');

  const isMobileApp = (userAgent && (userAgent.includes('SmarterNEET-Mobile') || userAgent.includes('Mobile'))) ||
                      (clientId && clientId.startsWith('flutter-'));

  if (!isMobileApp || !pathname.startsWith('/api/')) {
    return false;
  }

  for (const api of ALLOWED_MOBILE_APIS) {
    if (pathname.startsWith(api)) {
      return true;
    }
  }

  return false;
}

/**
 * Set security headers on the response
 */
function setSecurityHeaders(headers: Headers): void {
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  const csp = [
    "default-src 'self'",
    // Allow analytics, monitoring, Clerk, and Stripe scripts
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://vercel.live https://va.vercel-scripts.com https://clerk.smarterneet.com https://*.clerk.accounts.dev https://*.clerk.com https://www.clarity.ms https://scripts.clarity.ms https://js.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.clerk.accounts.dev",
    "font-src 'self' https://fonts.gstatic.com https://r2cdn.perplexity.ai https://*.clerk.accounts.dev data:",
    // Allow Stripe tracking pixel in addition to existing sources
    "img-src 'self' data: https: blob: https://q.stripe.com",
    // Allow Clerk telemetry and Stripe APIs
    "connect-src 'self' https://www.google-analytics.com https://vitals.vercel-insights.com https://clerk.smarterneet.com https://*.clerk.accounts.dev https://*.clerk.com wss://*.clerk.accounts.dev https://www.clarity.ms https://*.clarity.ms https://clerk-telemetry.com https://*.ingest.us.sentry.io https://*.sentry.io https://api.stripe.com https://hooks.stripe.com",
    // Allow Stripe frames in addition to existing sources
    "frame-src 'self' https://www.googletagmanager.com https://challenges.cloudflare.com https://*.clerk.accounts.dev https://js.stripe.com https://hooks.stripe.com https://vercel.live",
    "worker-src 'self' blob:",
    "media-src 'self' blob: data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ');

  headers.set('Content-Security-Policy', csp);
}

/**
 * Set cache control headers based on pathname
 */
function setCacheHeaders(headers: Headers, pathname: string): void {
  if (pathname.startsWith('/_next/static/')) {
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (pathname.startsWith('/api/')) {
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
  } else if (pathname === '/') {
    headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=86400');
  } else if (pathname.startsWith('/chemistry') || pathname.startsWith('/biology')) {
    headers.set('Cache-Control', 'public, max-age=0, must-revalidate, stale-while-revalidate=3600');
  } else {
    headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  }
}

/**
 * Handle authentication for protected routes
 */
async function handleAuth(
  auth: () => Promise<{ userId: string | null }>,
  req: NextRequest
): Promise<NextResponse | undefined> {
  if (!publicRoutes(req)) {
    const { userId } = await auth();
    if (!userId) {
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return NextResponse.redirect(signInUrl);
    }
  }
  return undefined;
}

// Apply middleware
const middleware = async (auth: () => Promise<{ userId: string | null }>, req: NextRequest) => {
  const pathname = req.nextUrl.pathname;

  // Fast path: Skip static files and images
  if (isStaticFile(pathname)) {
    return;
  }

  // If API request from mobile app, allow certain endpoints
  if (isMobileApiRequest(req, pathname)) {
    return;
  }

  // Create response and add headers
  const response = NextResponse.next();
  setSecurityHeaders(response.headers);
  setCacheHeaders(response.headers, pathname);

  // Handle authentication
  const authRedirect = await handleAuth(auth, req);
  if (authRedirect) {
    return authRedirect;
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