import { readFile } from "node:fs/promises";
import path from "node:path";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { LoggingMixin } from "./logging/mixin.js";
import { SentryMixin } from "./sentry/wrapped-server.js";
import { registerTools } from "./tools/index.js";

const instructions = await readFile(
  path.join(import.meta.dirname, "INSTRUCTIONS.md"),
  "utf8",
);

const ExtendedServer = SentryMixin(LoggingMixin(McpServer));
const server = new ExtendedServer(
  {
    name: "mdn",
    version: "0.0.1",
  },
  {
    instructions,
  },
);
registerTools(server);

export default server;
