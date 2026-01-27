import * as Sentry from "@sentry/node";

import { NonSentryError } from "./error.js";

/**
 * @import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
 */

/**
 * @template {new (...args: any[]) => McpServer} TBase
 * @param {TBase} McpServer
 */
export const SentryMixin = (McpServer) =>
  class SentryMcpServer extends McpServer {
    /**
     * @type {McpServer["registerTool"]}
     */
    registerTool(name, config, callback) {
      const wrappedCallback = /** @type {typeof callback} */ (
        async (/** @type {Parameters<typeof callback>} */ ...callbackArgs) => {
          Sentry.getCurrentScope().setTransactionName(`tool ${name}`);
          try {
            // @ts-expect-error: ts can't seem to handle passing through args like this
            return await callback(...callbackArgs);
          } catch (error) {
            if (!(error instanceof NonSentryError)) {
              Sentry.captureException(error);
            }
            throw error;
          }
        }
      );

      return super.registerTool(name, config, wrappedCallback);
    }
  };
