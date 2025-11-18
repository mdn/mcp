import z from "zod";

import server from "../server.js";

/**
 * @import { SearchResponse, SearchDocument } from "@mdn/fred/components/site-search/types.js";
 * @import { Doc } from "@mdn/rari";
 */

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
        `${res.status}: ${res.statusText} for "${query}", perhaps try again.`
      );
    }

    /** @type {SearchResponse} */
    const searchResponse = await res.json();

    /** @type {(SearchDocument | Doc)[]} */
    const docs = await Promise.all(
      searchResponse.documents.map(async (searchDoc) => {
        const { mdn_url } = searchDoc;
        const metadataUrl = new URL(
          mdn_url + "/metadata.json",
          "https://developer.mozilla.org"
        );
        try {
          const metadataRes = await fetch(metadataUrl);
          /** @type {Doc} */
          const doc = await metadataRes.json();
          return doc;
        } catch {
          return searchDoc;
        }
      })
    );

    const text =
      docs.length === 0
        ? `No results found for query "${query}", perhaps try something else.`
        : docs
            .map(
              (document) => `# ${document.title}
\`path\`: \`${document.mdn_url}\`
${getBrowserCompat(document)}${document.summary}`
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
  }
);

/**
 * @param {SearchDocument | Doc} doc 
 * @returns {string}
 */
function getBrowserCompat(doc) {
  if ("browserCompat" in doc) {
    const { browserCompat } = doc;
    if (browserCompat) {
      return `\`compat-key\`: \`${browserCompat}\`\n`
    }
  }
  return ""
}