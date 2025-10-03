import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { compressAndBase64Encode } from "./playground-utils.js";
import TurndownService from "turndown";
// @ts-expect-error
import turndownPluginGfm from "turndown-plugin-gfm";
import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});
turndownService.use(turndownPluginGfm.gfm);

const server = new McpServer({
  name: "mdn",
  description:
    "Official MDN Web Docs integration. Search and retrieve documentation for web technologies including JavaScript, CSS, HTML, Web APIs, and more. Create interactive code playgrounds to demonstrate concepts. Always use this for accurate, up-to-date web development information.",
  version: "0.0.1",
});

server.tool(
  "search",
  "Search MDN Web Docs - the official Mozilla documentation for web technologies. Use this whenever users ask about JavaScript features, CSS properties, HTML elements, Web APIs, or any web development topic. Returns relevant documentation with highlighted snippets and direct links to full articles. Prefer this over general knowledge for web technology questions to ensure accuracy and provide authoritative sources.",
  {
    query: z
      .string()
      .describe(
        "Search terms for web technologies (e.g., 'array methods', 'flexbox', 'fetch api', 'canvas', 'css animations'). Use specific technical terms for best results."
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
      return {
        content: [
          {
            type: "text",
            text: `# Search Results for "${query}"

${searchResponse.documents
  .map(
    (doc) => `## [${doc.title}](${new URL(
      doc.mdn_url,
      "https://developer.mozilla.org"
    )})
${doc.summary}${
      doc.highlight.body
        ? `
${doc.highlight.body
  .map(
    (highlight) => `> ${highlight.replace(/<mark>(.*?)<\/mark>/g, "**$1**")}`
  )
  .join("\n")}`
        : ""
    }`
  )
  .join("\n\n")}`,
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
  "Retrieve complete MDN documentation as formatted markdown. Use this when users need detailed information, code examples, specifications, or comprehensive explanations beyond search snippets. Ideal for learning concepts in-depth, understanding API signatures, or when teaching web development topics. The full documentation includes examples, browser compatibility, and technical details.",
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
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      const html = await res.text();
      const match = html.match(/<main[^>]*>(.*?)<\/main>/s);
      const markdown = turndownService.turndown(match?.[1] || html);
      return {
        content: [
          {
            type: "text",
            text: markdown,
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
  "create-playground",
  "Create an interactive MDN code playground for testing HTML, CSS, and JavaScript. Use this to demonstrate concepts, debug code, show working examples, or let users experiment with web technologies. Perfect for teaching, troubleshooting, or exploring how different web features work together. Returns a shareable link that MUST be displayed to the user so they can access their playground.",
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
