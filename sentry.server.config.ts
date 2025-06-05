// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const { nodeProfilingIntegration } = require("@sentry/profiling-node");
Sentry.init({
  dsn: "https://a250abd21c7c2f1d0f938e90fa152ba1@o4509370465058816.ingest.us.sentry.io/4509370489765888",
  integrations: [
    // Add our Profiling integration
  nodeProfilingIntegration(),
  Sentry.browserTracingIntegration(),
  Sentry.browserProfilingIntegration()
  ],
  tracesSampleRate: 1.0,
profileSessionSampleRate: 1.0,
tracePropagationTargets: ["localhost", /^https:\/\/smarterneet\.io\/api/],
profileLifecycle: 'trace',
});
// Profiling happens automatically after setting it up with `Sentry.init()`.
// All spans (unless those discarded by sampling) will have profiling data attached to them.
Sentry.startSpan(
  {
    op: "rootSpan",
    name: "My root span",
  },
  () => {
    // The code executed here will be profiled
  }
);
