import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['drizzle-orm'],
  experimental: {
    // Any other experimental options can go here
  },
  metadataBase: new URL('http://localhost:3000'),
  async headers() {
    return [
      {
        // Cache all static assets
        source: '/assets/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache public images
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=3600',
          },
        ],
      },
    ];
  },
  onDemandEntries: {
    // Keep the Redis connection alive in development
    maxInactiveAge: 60 * 60 * 1000, // 1 hour
    pagesBufferLength: 5,
  },
};

module.exports = nextConfig;

export default nextConfig;
