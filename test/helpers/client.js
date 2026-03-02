import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

/**
 * @import { StreamableHTTPClientTransportOptions } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
 */

import listen from "../../index.js";

export function createServer() {
  // auto-assign port
  return listen(0);
}

/**
 * @param {number} port
 * @param {StreamableHTTPClientTransportOptions} [opts]
 */
export async function createClient(port, opts) {
  const client = new Client({
    name: "test-client",
    version: "0.0.1",
  });
  const transport = new StreamableHTTPClientTransport(
    new URL(`http://localhost:${port}/mcp`),
    opts,
  );
  await client.connect(transport);
  return client;
}
