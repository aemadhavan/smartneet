// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const { nodeProfilingIntegration } = require("@sentry/profiling-node");

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: "https://a250abd21c7c2f1d0f938e90fa152ba1@o4509370465058816.ingest.us.sentry.io/4509370489765888",
    integrations: [nodeProfilingIntegration()],
    tracesSampleRate: 0.2,
    profileSessionSampleRate: 0.1,
    tracePropagationTargets: [/^https:\/\/smarterneet\.com\/api/],
    profileLifecycle: 'trace',
  });
}
