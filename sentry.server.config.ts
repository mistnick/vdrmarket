import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  environment: process.env.NODE_ENV,

  // Configure ignore errors
  ignoreErrors: [
    "ECONNREFUSED",
    "ETIMEDOUT",
  ],

  beforeSend(event, hint) {
    // Filter out development errors
    if (process.env.NODE_ENV === "development") {
      console.error("Sentry Event:", event);
      console.error("Original Error:", hint.originalException);
    }

    return event;
  },
});
