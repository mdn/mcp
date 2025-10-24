import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

import listen from "../../index.js";

/** @param {number} port */
export function createServer(port) {
  return listen(port);
}

/** @param {number} port */
export async function createClient(port) {
  const client = new Client({
    name: "test-client",
    version: "0.0.1",
  });
  const transport = new StreamableHTTPClientTransport(
    new URL(`http://localhost:${port}/mcp`),
  );
  await client.connect(transport);
  return client;
}
