import z from "zod";

import server from "../server.js";

server.registerTool(
  "get-doc",
  {
    inputSchema: {
      path: z.string(),
    },
  },
  async ({ path }) => {
    const url = new URL(path, "https://developer.mozilla.org");
    const res = await fetch(url + "/index.json");
    const json = await res.json();
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(json.doc),
        },
      ],
    };
  },
);
