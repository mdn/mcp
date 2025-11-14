import bcd from "@mdn/browser-compat-data" with { type: "json" };
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
    const [rootKey, ...subKeys] = key.split(".");
    let data;
    if (rootKey && rootKey in bcd) {
      const typedRootKey = /** @type {keyof typeof bcd} */ (rootKey);
      if (typedRootKey !== "__meta" && typedRootKey !== "browsers") {
        data = bcd[typedRootKey];
        for (const subKey of subKeys) {
          if (!data) break;
          data = data[subKey];
        }
      }
    }
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data),
        },
      ],
    };
  },
);
