import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const server = new McpServer(
  {
    name: "mdn",
    version: "0.0.1",
  },
  {
    instructions: `Available tools:

\`get-doc\`: Retrieve complete MDN documentation as formatted markdown. Use this when users need detailed information, code examples, specifications, or comprehensive explanations. Ideal for learning concepts in-depth, understanding API signatures, or when teaching web development topics.`,
  },
);

export default server;
