import { captureException } from "@sentry/node";

/**
 * @import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
 */

/**
 * @template {new (...args: any[]) => McpServer} TBase
 * @param {TBase} McpServer
 */
export const LoggingMixin = (McpServer) =>
  class LoggingMcpServer extends McpServer {
    /**
     * @type {McpServer["registerTool"]}
     */
    registerTool(name, config, callback) {
      const wrappedCallback = /** @type {typeof callback} */ (
        async (/** @type {Parameters<typeof callback>} */ ...callbackArgs) => {
          try {
            const args = callbackArgs?.[0];
            const headers = callbackArgs?.[1]?.requestInfo?.headers;
            console.log(
              `tool=${name} args=${JSON.stringify(args)} user-agent=${headers?.["user-agent"]} proto-version=${headers?.["mcp-protocol-version"]}`,
            );
            /* node:coverage disable */
          } catch (error) {
            captureException(error);
          }
          /* node:coverage enable */

          // @ts-expect-error: ts can't seem to handle passing through args like this
          return await callback(...callbackArgs);
        }
      );

      return super.registerTool(name, config, wrappedCallback);
    }
  };
