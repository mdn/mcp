import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

import listen from "../../index.js";

export function createServer() {
  // auto-assign port
  return listen(0);
}

/**
 * @param {number} port
 * @param {string} [path]
 */
export async function createClient(port, path = "") {
  const client = new Client({
    name: "test-client",
    version: "0.0.1",
  });
  const transport = new StreamableHTTPClientTransport(
    new URL(`http://localhost:${port}/${path}`),
  );
  await client.connect(transport);
  return client;
}
