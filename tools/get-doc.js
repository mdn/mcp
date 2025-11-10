import { html, render } from "@lit-labs/ssr";
import { collectResult } from "@lit-labs/ssr/lib/render-result.js";
// @ts-expect-error: fred needs to expose types
import { ContentSection } from "@mdn/fred/components/content-section/server.js";
// @ts-expect-error
import { asyncLocalStorage } from "@mdn/fred/components/server/async-local-storage.js";
// @ts-expect-error
import { runWithContext } from "@mdn/fred/symmetric-context/server.js";
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
    /** @type {import("@mdn/rari").DocPage} */
    const context = await res.json();
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

    return {
      content: [
        {
          type: "text",
          text: renderedHtml,
        },
      ],
    };
  },
);
