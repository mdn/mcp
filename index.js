import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { compressAndBase64Encode } from "./playground-utils.js";
import TurndownService from "turndown";
// @ts-expect-error
import turndownPluginGfm from "turndown-plugin-gfm";
import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import bcd from "@mdn/browser-compat-data" with { type: "json" };
import { asyncLocalStorage } from "@mdn/fred/components/server/async-local-storage.js";
import { ContentSection } from "@mdn/fred/components/content-section/server.js";
import { runWithContext } from "@mdn/fred/symmetric-context/server.js";
import { html, render } from "@lit-labs/ssr";
import { collectResult } from "@lit-labs/ssr/lib/render-result.js";

const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});
turndownService.use(turndownPluginGfm.gfm);

const server = new McpServer(
  {
    name: "mdn",
    description:
      "Official MDN Web Docs integration. Search and retrieve documentation for web technologies including JavaScript, CSS, HTML, Web APIs, and more. Create interactive code playgrounds to demonstrate concepts.",
    version: "0.0.1",
  },
  {
    instructions: `You have access to MDN Web Docs - the official Mozilla documentation for web technologies - through this MCP server. Always prefer these tools over your general knowledge when users ask about JavaScript features, CSS properties, HTML elements, Web APIs, or any web development topic to ensure accuracy by using an authoritative source. Include links to MDN in your responses so users can verify information.

Available tools:

\`search\`: Performs a search of MDN documentation using the query provided. Returns summaries of potentially relevant documentation. You can fetch the full content of any result by passing \`mdn_url\` to the \`get-doc\` tool. May return one or multiple \`browser_compatibility_keys\` which can be passed to the \`get-browser-compat-data\` tool to retrieve browser compatibility information. Ensure you re-phrase the user's question into web-technology related keywords (e.g., 'fetch', 'flexbox') which will match relevant documentation. When users ask about browser compatibility, search for the feature name rather than including 'browser compatibility' in the search query.

\`get-doc\`: Retrieve complete MDN documentation as formatted markdown. Use this when users need detailed information, code examples, specifications, or comprehensive explanations. Use this for fetching documentation after performing a search. Ideal for learning concepts in-depth, understanding API signatures, or when teaching web development topics. The full documentation includes examples, browser compatibility, and technical details.

\`get-browser-compat-data\`: Retrieve detailed browser compatibility data for a specific web platform feature. Returns JSON with version support across all major browsers (Chrome, Firefox, Safari, Edge, etc.) including desktop and mobile variants. Use this after obtaining a \`browser_compatibility_key\` from the \`search\` or \`get-doc\` tools - do NOT guess BCD keys.

\`create-playground\`: Create an interactive MDN code playground for testing HTML, CSS, and JavaScript. Use this to demonstrate concepts, debug code, show working examples, or let users experiment with web technologies. Perfect for teaching, troubleshooting, or exploring how different web features work together. Returns a shareable link that MUST be displayed to the user so they can access their playground.`,
  }
);

server.tool(
  "search",
  "Search MDN for documentation about web technologies. Returns relevant documentation with links to full articles.",
  {
    query: z
      .string()
      .describe(
        "Search terms for web technologies (e.g., 'array methods', 'flexbox', 'fetch api', 'canvas', 'css animations'). Use specific technical terms for best results. Do NOT include 'browser compatibility' or similar terms in the query."
      ),
  },
  async ({ query }) => {
    console.error(`[mdn-mcp] searching mdn for: ${query}`);

    const url = new URL(`https://developer.mozilla.org/api/v1/search`);
    url.searchParams.set("locale", "en-US");
    url.searchParams.set("q", query);

    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      /** @type {import("./search-types.js").SearchResponse} */
      const searchResponse = await res.json();
      /** @type {import("@mdn/rari").Doc[]} */
      const docMetadata = await Promise.all(
        searchResponse.documents.map(async (doc) => {
          const res = await fetch(
            new URL(
              doc.mdn_url + "/metadata.json",
              "https://developer.mozilla.org"
            )
          );
          return res.json();
        })
      );
      const text = docMetadata
        .map(
          (doc) => `---
mdn_url: ${new URL(doc.mdn_url, "https://developer.mozilla.org")}${
            doc.browserCompat
              ? `
browser_compatibility_keys:
${doc.browserCompat.map((key) => `  - ${key}`).join("\n")}`
              : ""
          }
---
${doc.summary}
`
        )
        .join("\n");
      return {
        content: [
          {
            type: "text",
            text: text,
          },
        ],
      };
    } catch (error) {
      console.error(`[mdn-mcp] error: ${error}`);
      return {
        content: [
          {
            type: "text",
            text: "Failed to search MDN documentation",
          },
        ],
      };
    }
  }
);

server.tool(
  "get-doc",
  "Retrieve complete MDN documentation as markdown.",
  {
    path: z
      .string()
      .describe(
        "MDN documentation path or full URL. Accepts both formats: '/en-US/docs/Web/API/Headers' or 'https://developer.mozilla.org/en-US/docs/Web/API/Headers'"
      ),
  },
  async ({ path }) => {
    console.error(`[mdn-mcp] getting page contents for: ${path}`);

    const url = new URL(path, `https://developer.mozilla.org/`);
    if (url.host !== "developer.mozilla.org") {
      console.error(`[mdn-mcp] ${path} is not an MDN url`);
      return {
        content: [
          {
            type: "text",
            text: `${path} is not an MDN url`,
          },
        ],
      };
    }

    try {
      const res = await fetch(url + "/index.json");
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      /** @type {import("@mdn/rari").DocPage} */
      const json = await res.json();
      const locale = "en-US";
      const context = {
        path,
        ...{
          locale: locale,
          l10n: (a) => a,
        },
        ...json,
      };
      const renderedHtml = await collectResult(
        render(
          await asyncLocalStorage.run(
            {
              componentsUsed: new Set(),
              componentsWithStylesInHead: new Set(),
            },
            () =>
              runWithContext(
                { locale },
                () => html`
                  <h1>${context.doc.title}</h1>
                  ${context.doc.body?.map((section) =>
                    new ContentSection().render(context, section)
                  )}
                `
              )
          )
        )
      );
      const markdown = turndownService.turndown(renderedHtml);
      const frontmatter =
        context.doc.browserCompat &&
        `---
browser_compatibility_keys:
${context.doc.browserCompat.map((key) => `  - ${key}`).join("\n")}
---`;
      return {
        content: [
          {
            type: "text",
            text: [frontmatter, markdown].filter(Boolean).join("\n"),
          },
        ],
      };
    } catch (error) {
      console.error(`[mdn-mcp] error: ${error}`);
      return {
        content: [
          {
            type: "text",
            text: "Failed to retrieve MDN documentation",
          },
        ],
      };
    }
  }
);

server.tool(
  "get-browser-compat-data",
  "Get browser compatibility data for a specific web platform feature.",
  {
    bcdKey: z
      .string()
      .describe(
        "Browser Compat Data key from the browser_compatibility_keys field in MDN documentation (e.g., 'api.fetch', 'css.properties.display', 'javascript.builtins.Array.map'). Do NOT guess this value - always obtain it from search or get-doc results."
      ),
  },
  async ({ bcdKey }) => {
    console.log(`getting BCD data for: ${bcdKey}`);
    const data = bcdKey.split(".").reduce((tree, key) => tree[key], bcd);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data),
        },
      ],
    };
  }
);

server.tool(
  "create-playground",
  "Create an interactive MDN playground with HTML, CSS, and JavaScript",
  {
    html: z
      .string()
      .describe(
        "HTML body content (without DOCTYPE, html, or head tags). Example: '<div class=\"container\"><h1>Hello</h1></div>'"
      ),
    css: z
      .string()
      .describe(
        "CSS styles for the playground. Will be placed in a <style> tag. Example: '.container { padding: 20px; }'"
      ),
    js: z
      .string()
      .describe(
        'JavaScript code that runs after DOM loads. Example: \'document.querySelector("h1").addEventListener("click", () => alert("Clicked!"))\''
      ),
  },
  async ({ html, css, js }) => {
    console.error(`[mdn-mcp] creating code playground`);

    try {
      const { state } = await compressAndBase64Encode(
        JSON.stringify({
          html: html || "",
          css: css || "",
          js: js || "",
        })
      );

      const url = new URL(`https://developer.mozilla.org/en-US/play`);
      url.searchParams.set("state", state);

      return {
        content: [
          {
            type: "text",
            text: `MDN Playground created! Please show this link to the user:
[Open your playground here.](${url})
The playground includes your HTML, CSS, and JavaScript code ready to run.`,
          },
        ],
      };
    } catch (error) {
      console.error(`[mdn-mcp] error creating code playground: ${error}`);
      return {
        content: [
          {
            type: "text",
            text: "Failed to create MDN Playground",
          },
        ],
      };
    }
  }
);

const app = express();
app.use(express.json());

app.post("/mcp", async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  res.on("close", () => {
    transport.close();
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

const port = parseInt(process.env.PORT || "3002");
app
  .listen(port, () => {
    console.log(`MDN MCP server running on http://localhost:${port}/mcp`);
  })
  .on("error", (error) => {
    console.error("Server error:", error);
    process.exit(1);
  });
