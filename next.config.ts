import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from "next";
import path from 'path';

const nextConfig: NextConfig = {
  serverExternalPackages: ['drizzle-orm'],
  
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Disable aggressive preloading
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  experimental: {
    optimizePackageImports: [
      // Add your UI libraries here, example:
      '@mantine/core',
      '@mantine/hooks'
    ]
  },

  webpack: (config, { dev }) => {
    if (!dev) {
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [path.resolve(__dirname, 'next.config.ts')]
        },
        cacheDirectory: path.resolve(process.cwd(), '.next/cache'),
        compression: 'gzip',
        maxAge: 172800000, // 2 days
        version: '1.0.0'
      };
      
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
  automaticVercelMonitors: true
});
