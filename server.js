import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const server = new McpServer(
  {
    name: "mdn",
    version: "0.0.1",
  },
  {
    instructions: `Available tools:

\`search\`: Performs a search of MDN documentation using the query provided. You can fetch the full content of any result by passing \`path\` to the \`get-doc\` tool. Ensure you re-phrase the user's question into web-technology related keywords (e.g. 'fetch', 'flexbox') which will match relevant documentation. When users ask about browser compatibility, search for the feature name rather than including 'browser compatibility' in the search query.

\`get-doc\`: Retrieve complete MDN documentation as formatted markdown. Use this when users need detailed information, code examples, specifications, or comprehensive explanations. Ideal for learning concepts in-depth, understanding API signatures, or when teaching web development topics.

\`get-compat\`: Retrieve detailed Browser Compatibility Data (BCD) for a specific web platform feature. Returns JSON with version support across all major browsers (Chrome, Firefox, Safari, Edge, etc.) including desktop and mobile variants.`,
  },
);

export default server;
