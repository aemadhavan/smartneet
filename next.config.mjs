/** @type {import('next').NextConfig} */

//import { withSentryConfig } from '@sentry/nextjs';

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://vercel.live https://va.vercel-scripts.com https://*.clerk.accounts.dev https://*.clerk.com https://www.clarity.ms https://scripts.clarity.ms;
  script-src-elem 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://vercel.live https://va.vercel-scripts.com https://*.clerk.accounts.dev https://*.clerk.com https://www.clarity.ms https://scripts.clarity.ms;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  connect-src 'self' https://www.google-analytics.com https://vitals.vercel-insights.com https://clerk.smarterneet.com https://*.clerk.accounts.dev https://*.clerk.com wss://*.clerk.accounts.dev https://www.clarity.ms https://*.clarity.ms https://clerk-telemetry.com https://*.ingest.us.sentry.io https://*.sentry.io;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https://img.clerk.com https://images.clerk.dev;
  frame-src 'self' https://www.googletagmanager.com https://*.clerk.accounts.dev;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
`;

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy.replace(/\s{2,}/g, ' ').trim(),
  },
];

const nextConfig = {
  // Enable compression for faster response times
  compress: true,

  // Optimize production source maps - smaller and faster
  productionBrowserSourceMaps: false,

  // Enable experimental features for better performance
  experimental: {
    // Enable optimized package imports to reduce bundle size
    // Added more heavy libraries for optimization
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-switch',
      'framer-motion',
      'recharts',
      'react-markdown',
      '@clerk/nextjs'
    ],
    // Optimize CSS loading
    optimizeCss: true,
  },

  // Tree-shake console.* in production and help bundler
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Prefer per-icon imports for lucide to avoid pulling all icons
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
  },

  async headers() {
    return [
      {
        // Apply these headers to all routes in your application.
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/assets/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
        ],
      },
      {
        source: '/smarterneet-logo.jpeg',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
        ],
      },
      {
        source: '/:path*.webp',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=3600' }
        ],
      },
      {
        source: '/:path*.map',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' }
        ],
      },
    ];
  },
  images: {
    // Prefer modern formats and ensure good defaults
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [60, 75, 85, 90, 95, 100],
    remotePatterns: [
      { protocol: 'https', hostname: 'localhost' },
      { protocol: 'http', hostname: 'localhost' }
    ],
  },
  webpack: (config, { isServer }) => {
    // Suppress the OpenTelemetry instrumentation warning
    if (isServer) {
      config.ignoreWarnings = [
        { module: /node_modules\/@opentelemetry\/instrumentation/ },
        { message: /Critical dependency: the request of a dependency is an expression/ },
      ];
    }

    // Allow Next.js to handle optimal chunking heuristics by default.
    // Custom vendor chunking can accidentally pull too much JS into the initial route.
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
      };
    }

    return config;
  },
};

export default nextConfig;

// Wrap the config with Sentry - TEMPORARILY DISABLED to fix build issue
/*export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: "smarterneet",
  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Automatically annotate React components to show their full name in breadcrumbs and session replay
  reactComponentAnnotation: {
    enabled: true,
  },

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,

  // Disable automatic instrumentation for Pages Router error pages (we're using App Router)
  autoInstrumentServerFunctions: false,
  autoInstrumentMiddleware: false,
});*/