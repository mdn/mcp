import * as Sentry from "@sentry/node";

const SENTRY_DSN = process.env.SENTRY_DSN;

/* node:coverage disable */
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
  });
}
/* node:coverage enable */
