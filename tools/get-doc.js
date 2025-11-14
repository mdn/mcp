import { html, render } from "@lit-labs/ssr";
import { collectResult } from "@lit-labs/ssr/lib/render-result.js";
// @ts-expect-error: fred needs to expose types
import { ContentSection } from "@mdn/fred/components/content-section/server.js";
// @ts-expect-error
import { asyncLocalStorage } from "@mdn/fred/components/server/async-local-storage.js";
// @ts-expect-error
import { runWithContext } from "@mdn/fred/symmetric-context/server.js";
import TurndownService from "turndown";
// @ts-expect-error
import turndownPluginGfm from "turndown-plugin-gfm";
import z from "zod";

import server from "../server.js";

const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});
turndownService.use(turndownPluginGfm.gfm);

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
      throw new Error(`Error: ${url} doesn't look like an MDN url`);
    }
    if (!/^\/?([a-z-]+?\/)?docs\//i.test(url.pathname)) {
      throw new Error(
        `Error: ${path} doesn't look like the path to a piece of MDN documentation`,
      );
    }
    if (!url.pathname.endsWith("/index.json")) {
      url.pathname += "/index.json";
    }

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`${res.status}: ${res.statusText} for ${path}`);
    }

    /** @type {import("@mdn/rari").DocPage} */
    const json = await res.json();
    const context = {
      ...json,
      // @ts-expect-error
      l10n: (x) => x,
    };
    // TODO: expose better API for this from fred
    const renderedHtml = await collectResult(
      render(
        await asyncLocalStorage.run(
          {
            componentsUsed: new Set(),
            componentsWithStylesInHead: new Set(),
          },
          () =>
            runWithContext(
              {},
              () => html`
                <h1>${context.doc.title}</h1>
                ${context.doc.body?.map((section) =>
                  new ContentSection().render(context, section),
                )}
              `,
            ),
        ),
      ),
    );
    const markdown = turndownService.turndown(renderedHtml);

    let frontmatter = "";
    const { browserCompat } = context.doc;
    if (browserCompat) {
      frontmatter += "---\n";
      if (browserCompat.length > 1) {
        frontmatter += "bcd_keys:\n";
        frontmatter += browserCompat.map((key) => `  - ${key}\n`).join("");
      } else {
        frontmatter += `bcd_key: ${browserCompat[0]}\n`;
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
