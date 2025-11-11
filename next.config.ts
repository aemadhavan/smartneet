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
    qualities: [75, 85, 90, 100],
  },

  // SWC compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Optimize package imports for faster builds
  experimental: {
    optimizePackageImports: [
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

  webpack: (config, { dev }) => {
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

    if (!dev) {
      // Add chunk loading error handling
      config.output = {
        ...config.output,
        chunkLoadingGlobal: 'webpackChunksmartner',
        chunkLoadTimeout: 120000, // 2 minutes
      };

      // Optimize chunk splitting
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              priority: -10,
              reuseExistingChunk: true,
            },
            common: {
              name: 'common',
              minChunks: 2,
              priority: -30,
              reuseExistingChunk: true,
            },
          },
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
      }
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
  sourcemaps: {
    disable: true
  },
  autoInstrumentServerFunctions: false,
  autoInstrumentMiddleware: false
});
