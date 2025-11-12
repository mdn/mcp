import z from "zod";

import server from "../server.js";

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
    /** @type {import("@mdn/fred/components/site-search/types.js").SearchResponse} */
    const searchResponse = await res.json();

    const text = searchResponse.documents
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
