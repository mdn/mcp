// @ts-expect-error: fred needs to expose types: https://github.com/mdn/fred/issues/1404
import { renderSimplified } from "@mdn/fred/out/static/ssr/index.js";
import TurndownService from "turndown";
// @ts-expect-error
import turndownPluginGfm from "turndown-plugin-gfm";
import z from "zod";

import { fetched } from "../glean/generated/getDoc.js";
import { submitEvent } from "../glean/glean.js";
import { NonSentryError } from "../sentry/error.js";

const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});
turndownService.use(turndownPluginGfm.gfm);

const BASE_URL = "https://developer.mozilla.org";

/** @param {InstanceType<import("../server.js").ExtendedServer>} server */
export function registerGetDocTool(server) {
  const title = "Get documentation";
  server.registerTool(
    "get-doc",
    {
      title,
      description: "Retrieve a page of MDN documentation as markdown.",
      annotations: {
        title,
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      inputSchema: {
        path: z
          .string()
          .describe("path or full URL: e.g. '/en-US/docs/Web/API/Headers'"),
      },
    },
    async ({ path }, request) => {
      const originalPath = path;
      let redirected = false;
      for (let i = 0; i < 5; i++) {
        const url = new URL(path, BASE_URL);
        if (url.host !== "developer.mozilla.org") {
          throw new NonSentryError(
            `Error: ${url} doesn't look like an MDN url`,
            "non_mdn_host",
          );
        }
        if (!/^\/?([a-z-]+?\/)?docs\//i.test(url.pathname)) {
          throw new NonSentryError(
            `Error: ${path} doesn't look like the path to a piece of MDN documentation`,
            "non_doc_path",
          );
        }
        if (!url.pathname.endsWith("/index.json")) {
          url.pathname += "/index.json";
        }

        const res = await fetch(url, { redirect: "manual" });
        if (!res.ok) {
          if (res.status >= 300 && res.status <= 399) {
            const location = res.headers.get("location");
            if (typeof location === "string") {
              const next = new URL(location, url);
              next.pathname = next.pathname.replace(/\/index\.json$/, "");
              next.hash = next.hash.replace(/\/index\.json$/, "");
              if (next.host === "developer.mozilla.org") {
                path = next.pathname + next.hash;
                redirected = true;
                continue;
              } else {
                return {
                  content: [
                    {
                      type: "text",
                      text: `The MDN path \`${originalPath}\` redirects to \`${next}\`, consider fetching the contents of that page.`,
                    },
                  ],
                };
              }
              /* node:coverage ignore next 3 */
            }
            throw new Error(`Error: Malformed redirect from ${path}`);
          }
          if (res.status === 404) {
            throw new NonSentryError(`Error: We couldn't find ${path}`, "404");
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
        let note = "";
        if (redirected && !path.endsWith(originalPath)) {
          note = url.hash
            ? `\`${originalPath}\` redirected to \`${path}\`, the contents of the full page follows:\n`
            : `\`${originalPath}\` redirected to \`${path}\`:\n`;
        }

        submitEvent(fetched, request, { path: context.url });

        return {
          content: [
            {
              type: "text",
              text: frontmatter + note + markdown,
            },
          ],
        };
      }
      throw new Error(`Error: \`${originalPath}\` redirected too many times`);
    },
  );
}
