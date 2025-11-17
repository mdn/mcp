import bcd from "@mdn/browser-compat-data" with { type: "json" };
import z from "zod";

import server from "../server.js";

server.registerTool(
  "get-compat",
  {
    title: "Get browser compatibility data",
    description: "Retrieve MDN's Browser Compatibility Data.",
    inputSchema: {
      key: z.string().describe("BCD key from MDN (e.g., 'api.fetch')"),
    },
  },
  async ({ key }) => {
    const [rootKey, ...subKeys] = key.split(".");
    let data;
    let usedKeys = [];
    if (rootKey && rootKey in bcd) {
      const typedRootKey = /** @type {keyof typeof bcd} */ (rootKey);
      if (typedRootKey !== "__meta" && typedRootKey !== "browsers") {
        usedKeys.push(typedRootKey);
        data = bcd[typedRootKey];
        for (const subKey of subKeys) {
          if (!data) break;
          usedKeys.push(subKey);
          data = data[subKey];
        }
      }
    }
    const lastValidKey = usedKeys.slice(0, -1).join(".");
    return {
      content: [
        {
          type: "text",
          text: data
            ? JSON.stringify(data)
            : `Error: We couldn't find "${key}" in the Browser Compatibility Data.` +
              (lastValidKey
                ? ` However, "${lastValidKey}" appears to be a valid key.`
                : ""),
        },
      ],
    };
  },
);
