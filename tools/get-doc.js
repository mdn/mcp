// @ts-expect-error: fred needs to expose types
import { renderSimplified } from "@mdn/fred/out/static/ssr/index.js";
import TurndownService from "turndown";
// @ts-expect-error
import turndownPluginGfm from "turndown-plugin-gfm";
import z from "zod";

import { NonSentryError } from "../sentry/error.js";

const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});
turndownService.use(turndownPluginGfm.gfm);

/** @param {InstanceType<import("../server.js").ExtendedServer>} server */
export function registerGetDocTool(server) {
  server.registerTool(
    "get-doc",
    {
      title: "Get documentation",
      description: "Retrieve a page of MDN documentation as markdown.",
      inputSchema: {
        path: z
          .string()
          .describe("path or full URL: e.g. '/en-US/docs/Web/API/Headers'"),
      },
    },
    async ({ path }) => {
      const url = new URL(path, "https://developer.mozilla.org");
      if (url.host !== "developer.mozilla.org") {
        throw new NonSentryError(`Error: ${url} doesn't look like an MDN url`);
      }
      if (!/^\/?([a-z-]+?\/)?docs\//i.test(url.pathname)) {
        throw new NonSentryError(
          `Error: ${path} doesn't look like the path to a piece of MDN documentation`,
        );
      }
      if (!url.pathname.endsWith("/index.json")) {
        url.pathname += "/index.json";
      }

      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 404) {
          throw new NonSentryError(`Error: We couldn't find ${path}`);
        }
        throw new Error(`${res.status}: ${res.statusText} for ${path}`);
      }

      /** @type {import("@mdn/rari").DocPage} */
      const context = await res.json();
      const renderedHtml = await renderSimplified(context.url, context);
      const markdown = turndownService.turndown(renderedHtml);

      let frontmatter = "";
      const { browserCompat } = context.doc;
      if (browserCompat) {
        frontmatter += "---\n";
        if (browserCompat.length > 1) {
          frontmatter += "compat-keys:\n";
          frontmatter += browserCompat.map((key) => `  - ${key}\n`).join("");
        } else {
          frontmatter += `compat-key: ${browserCompat[0]}\n`;
        }
        frontmatter += "---\n";
      }

      return {
        content: [
          {
            type: "text",
            text: frontmatter + markdown,
          },
        ],
      };
    },
  );
}
