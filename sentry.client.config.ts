// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Disable Sentry in development to avoid network dependencies affecting LCP
if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: "https://a250abd21c7c2f1d0f938e90fa152ba1@o4509370465058816.ingest.us.sentry.io/4509370489765888",
    tracesSampleRate: 0.1,
    debug: false,
    replaysOnErrorSampleRate: 0.2,
    replaysSessionSampleRate: 0.02,
    integrations: [], // Disable heavy Replay integration by default on prod homepage
  });
}
