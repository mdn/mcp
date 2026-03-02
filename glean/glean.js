import Glean from "@mozilla/glean/node";
import { captureException } from "@sentry/node";

/**
 * @import EventMetricType from "@mozilla/glean/private/metrics/event";
 * @import { ExtraMap } from "@mozilla/glean/private/metrics/events_database/recorded_event";
 * @import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
 * @import { Request, Notification } from "@modelcontextprotocol/sdk/types.js";
 */

const uploadEnabled = process.env.GLEAN_ENABLED === "true";
const GLEAN_CHANNEL = process.env.GLEAN_CHANNEL || "dev";
const GLEAN_DEBUG = process.env.GLEAN_DEBUG === "true";

/* node:coverage disable */
if (GLEAN_DEBUG) {
  Glean.setDebugViewTag("mdn-dev");
  Glean.setLogPings(true);
}
/* node:coverage enable */

Glean.initialize("mdn-mcp", uploadEnabled, {
  channel: GLEAN_CHANNEL,
});

/**
 * @template {ExtraMap} E
 * @template {Request} R
 * @template {Notification} N
 * @param {EventMetricType<E>} event
 * @param {RequestHandlerExtra<R, N>} [request]
 * @param {E} [extra]
 */
export function submitEvent(event, request, extra) {
  try {
    const optOut =
      request?.requestInfo?.headers?.["x-moz-1st-party-data-opt-out"] === "1";
    if (optOut) return;

    const user_agent =
      request?.requestInfo?.headers?.["user-agent"]?.toString();
    event.record(
      /** @type {E} */ ({
        ...extra,
        ...(user_agent ? { user_agent } : undefined),
      }),
    );
    /* node:coverage disable */
  } catch (error) {
    // we don't want to throw, the request should work
    // even if glean fails in some way
    console.error(error);
    captureException(error);
  }
  /* node:coverage enable */
}
