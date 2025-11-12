import z from "zod";

import server from "../server.js";

server.registerTool(
  "search",
  {
    title: "Search",
    description: "Search MDN for documentation about web technologies.",
    inputSchema: {
      query: z.string().describe("search terms: e.g. 'array methods'"),
    },
  },
  async ({ query }) => {
    return {
      content: [
        {
          type: "text",
          text: query,
        },
      ],
    };
  },
);
