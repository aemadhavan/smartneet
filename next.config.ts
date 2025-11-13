import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig = {
  serverExternalPackages: ['drizzle-orm'],

  // Temporarily disabled standalone mode due to Html import errors
  // output: 'standalone',

  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [60, 75, 85, 90, 100],
  },

  // SWC compiler optimizations
  // SWC minification is now enabled by default in Next.js 15+
  // Target modern browsers to avoid unnecessary polyfills (~14KB savings)
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Optimize package imports for faster builds
  experimental: {
    optimizePackageImports: [
      '@clerk/nextjs',
      '@radix-ui/react-dialog',
      '@radix-ui/react-label',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      'lucide-react',
      'recharts',
      'framer-motion',
    ],
  },

  // Modularize imports for better tree-shaking
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
    '@radix-ui/react-icons': {
      transform: '@radix-ui/react-icons/dist/{{member}}',
    },
  },

  webpack: (config, { dev, webpack }) => {
    // Enable filesystem caching for both dev and production builds
    config.cache = {
      type: 'filesystem',
      buildDependencies: {
        config: [path.resolve(__dirname, 'next.config.ts')]
      },
      cacheDirectory: path.resolve(process.cwd(), '.next/cache/webpack'),
      compression: 'gzip',
      maxAge: dev ? 604800000 : 172800000, // 7 days for dev, 2 days for prod
      version: '1.0.0'
    };

    // Enable source maps for production (hidden source maps for security)
    if (!dev) {
      config.devtool = 'hidden-source-map';

      // Add chunk loading error handling
      config.output = {
        ...config.output,
        chunkLoadingGlobal: 'webpackChunksmartner',
        chunkLoadTimeout: 120000, // 2 minutes
      };

      // Optimize chunk splitting with granular vendor splitting
      config.optimization = {
        ...config.optimization,
        // Reduce main-thread blocking by keeping runtime separate
        runtimeChunk: 'single',
        // Minimize with parallel processing to reduce bundle sizes
        minimize: true,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Split Clerk into its own chunk to be lazy loaded
            clerk: {
              test: /[\\/]node_modules[\\/]@clerk[\\/]/,
              name: 'clerk',
              priority: 30,
              reuseExistingChunk: true,
              enforce: true,
            },
            // Split large UI libraries
            radix: {
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              name: 'radix-ui',
              priority: 25,
              reuseExistingChunk: true,
              enforce: true,
            },
            // Split recharts (used in dashboard/analytics)
            recharts: {
              test: /[\\/]node_modules[\\/]recharts[\\/]/,
              name: 'recharts',
              priority: 25,
              reuseExistingChunk: true,
              enforce: true,
            },
            // Split framer-motion (animations)
            framer: {
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
              name: 'framer-motion',
              priority: 25,
              reuseExistingChunk: true,
              enforce: true,
            },
            // Split Embla carousel to reduce main-app chunk size
            embla: {
              test: /[\\/]node_modules[\\/]embla-carousel/,
              name: 'embla-carousel',
              priority: 25,
              reuseExistingChunk: true,
              enforce: true,
            },
            // React and core dependencies
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              name: 'react-vendor',
              priority: 20,
              reuseExistingChunk: true,
              enforce: true,
            },
            // Other vendor code
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendor',
              priority: 10,
              reuseExistingChunk: true,
              // Only create vendor chunk if module is used in multiple places
              minChunks: 2,
            },
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
            common: {
              name: 'common',
              minChunks: 2,
              priority: -30,
              reuseExistingChunk: true,
            },
          },
          // Limit max initial requests to balance between caching and HTTP overhead
          maxInitialRequests: 25,
          maxAsyncRequests: 30,
          // Only split chunks larger than 20KB
          minSize: 20000,
          // Aggressive splitting for chunks larger than 200KB to prevent long tasks
          maxSize: 200000,
        },
      };
    }
    return config;
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Document-Policy",
            value: "js-profiling"
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on"
          }
        ]
      },
      {
        source: '/',
        headers: [
          {
            key: 'Link',
            value: '<https://fonts.googleapis.com>; rel=preconnect, <https://fonts.gstatic.com>; rel=preconnect; crossorigin, <https://www.googletagmanager.com>; rel=preconnect'
          }
        ]
      },
      {
        source: '/assets/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=3600'
          }
        ]
      },
      // Cache Google Tag Manager script for 1 day
      {
        source: '/gtm.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400'
          }
        ]
      },
      // Block public access to source map files (defense-in-depth)
      {
        source: '/:path*.map',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow'
          }
        ]
      }
    ];
  },

  async rewrites() {
    return [
      {
        source: '/gtm.js',
        destination: 'https://www.googletagmanager.com/gtm.js?id=GTM-WVBD7SRF',
      },
    ];
  },

  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000, // 1 hour
    pagesBufferLength: 5
  }
};

export default withSentryConfig(nextConfig, {
  org: "inner-sharp-consulting-pty-ltd",
  project: "smarterneet",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  disableLogger: true,
  automaticVercelMonitors: true,
  // Enable source maps and upload to Sentry
  sourcemaps: {
    disable: false,
    // Delete source maps from build output after upload to Sentry
    deleteSourcemapsAfterUpload: true,
  },
  autoInstrumentServerFunctions: false,
  autoInstrumentMiddleware: false
});
