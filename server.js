import { readFile } from "node:fs/promises";
import path from "node:path";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { SentryMixin } from "./sentry/wrapped-server.js";

const instructions = await readFile(
  path.join(import.meta.dirname, "INSTRUCTIONS.md"),
  "utf8",
);

const ExtendedServer = SentryMixin(McpServer);
const server = new ExtendedServer(
  {
    name: "mdn",
    version: "0.0.1",
  },
  {
    instructions,
  },
);

export default server;
