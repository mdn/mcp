import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const server = new McpServer(
  {
    name: "mdn",
    version: "0.0.1",
  },
  {
    instructions: `Available tools:

\`get-doc\`: Retrieve complete MDN documentation as formatted markdown. Use this when users need detailed information, code examples, specifications, or comprehensive explanations. Ideal for learning concepts in-depth, understanding API signatures, or when teaching web development topics.

\`get-browser-compat\`: Retrieve detailed Browser Compatibility Data (BCD) for a specific web platform feature. Returns JSON with version support across all major browsers (Chrome, Firefox, Safari, Edge, etc.) including desktop and mobile variants.`,
  },
);

export default server;
