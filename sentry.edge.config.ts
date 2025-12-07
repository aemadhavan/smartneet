// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: "https://a250abd21c7c2f1d0f938e90fa152ba1@o4509370465058816.ingest.us.sentry.io/4509370489765888",
    tracesSampleRate: 0.1,
    debug: false,
  });
}
