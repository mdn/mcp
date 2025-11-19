import { readFile } from "node:fs/promises";
import path from "node:path";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const instructions = await readFile(
  path.join(import.meta.dirname, "INSTRUCTIONS.md"),
  "utf8",
);

const server = new McpServer(
  {
    name: "mdn",
    version: "0.0.1",
  },
  {
    instructions,
  },
);

export default server;
