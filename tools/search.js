import z from "zod";

import server from "../server.js";

/** @import { SearchResponse, SearchDocument } from "@mdn/fred/components/site-search/types.js"; */

server.registerTool(
  "search",
  {
    title: "Search",
    description: "Search MDN for documentation about web technologies.",
    inputSchema: {
      query: z.string().describe("search terms: e.g. 'array methods'"),
    },
  },
  async ({ query }) => {
    const url = new URL(`https://developer.mozilla.org/api/v1/search`);
    url.searchParams.set("q", query);

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(
        `${res.status}: ${res.statusText} for "${query}", perhaps try again.`,
      );
    }

    /** @type {SearchResponse} */
    const searchResponse = await res.json();

    /** @type {SearchDocument[]} */
    const docs = searchResponse.documents;

    const text =
      docs.length === 0
        ? `No results found for query "${query}", perhaps try something else.`
        : docs
            .map(
              (document) => `# ${document.title}
\`path\`: \`${document.mdn_url}\`
${document.summary}`,
            )
            .join("\n\n");

    return {
      content: [
        {
          type: "text",
          text,
        },
      ],
    };
  },
);
