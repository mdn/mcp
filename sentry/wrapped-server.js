import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as Sentry from "@sentry/node";

import { NonSentryError } from "./error.js";

export class SentryMcpServer extends McpServer {
  /**
   * @template {import("zod").ZodRawShape} InputArgs
   * @template {import("zod").ZodRawShape} OutputArgs
   * @param {Parameters<typeof McpServer.prototype.registerTool<InputArgs, OutputArgs>>} args
   */
  registerTool(...args) {
    const [name, config, callback] = args;

    const wrappedCallback =
      /** @type {Parameters<typeof McpServer.prototype.registerTool<InputArgs, OutputArgs>>[2]} */ (
        async (...callbackArgs) => {
          Sentry.getCurrentScope().setTransactionName(`tool ${name}`);
          try {
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
}
