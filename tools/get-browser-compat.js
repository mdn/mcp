import z from "zod";

import server from "../server.js";

server.registerTool(
  "get-browser-compat",
  {
    title: "Get browser compatibility data",
    description: "Retrieve MDN's Browser Compatibility Data.",
    inputSchema: {
      key: z.string(),
    },
  },
  async ({ key }) => {
    return {
      content: [
        {
          type: "text",
          text: key,
        },
      ],
    };
  },
);
