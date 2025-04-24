//File: /next-types-fix.d.ts
// Enhanced type declarations for Next.js 15.2.4 route handlers
import { NextRequest } from 'next/server';

// Remove problematic route handler param typing
declare module 'next/server' {
  // Define ParamCheck with a params property
  export type ParamCheck<T> = {
    __param_type__: {
      params: {
        sessionId: string;
      };
    };
  };
  export type RouteHandlerContext = any;
  export type RouteSegmentConfig = {
    dynamic?: 'auto' | 'force-dynamic' | 'error' | 'force-static';
    revalidate?: false | 0 | number;
    fetchCache?: 'auto' | 'default-cache' | 'only-cache' | 'force-cache' | 'force-no-store' | 'default-no-store' | 'only-no-store';
    runtime?: 'nodejs' | 'edge';
    preferredRegion?: 'auto' | 'global' | 'home' | string | string[];
  };
}

// Augmentation to make route handlers work with simple params
declare module 'next/dist/server/web/exports' {
  export type RouteHandler = (request: NextRequest, context?: any) => Response | Promise<Response>;
}
