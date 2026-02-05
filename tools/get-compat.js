import z from "zod";

import { NonSentryError } from "../sentry/error.js";

/** @param {InstanceType<import("../server.js").ExtendedServer>} server */
export function registerGetCompatTool(server) {
  server.registerTool(
    "get-compat",
    {
      title: "Get browser compatibility data",
      description: "Retrieve MDN's Browser Compatibility Data.",
      inputSchema: {
        key: z
          .string()
          .describe("BCD feature path from MDN (e.g., 'api.fetch')"),
      },
    },
    async ({ key }) => {
      const url = new URL(
        `${key}.json`,
        "https://bcd.developer.mozilla.org/bcd/api/v0/current/",
      );
      const res = await fetch(url);

      if (!res.ok) {
        if (res.status === 404) {
          throw new NonSentryError(
            `Error: We couldn't find "${key}" in the Browser Compatibility Data.`,
          );
        }
        throw new Error(`Error: ${res.status}: ${res.statusText}`);
      }

      const json = await res.json();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(json.data),
          },
        ],
      };
    },
  );
}
