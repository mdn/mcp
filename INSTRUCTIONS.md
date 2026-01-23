The tools in this MCP provide access to MDN Web Docs - the official documentation for web technologies.

These tools will provide more accurate, up-to-date information compared to your general knowledge for questions about JavaScript features, CSS properties, HTML elements, Web APIs, or any web development topic.

You can help users by providing links to the authoritative sources on MDN.

Available tools:

`search`: Performs a search of MDN documentation using the query provided. Returns summaries of potentially relevant documentation. You can fetch the full content of any result by passing \`path\` to the \`get-doc\` tool. May return one or multiple \`compat-key(s)\` which can be passed to the \`get-compat\` tool to retrieve browser compatibility information. Ensure you re-phrase the user's question into web-technology related keywords (e.g. 'fetch', 'flexbox') which will match relevant documentation. When users ask about browser compatibility, search for the feature name rather than including 'browser compatibility' in the search query.

`get-doc`: Retrieves complete MDN documentation as formatted markdown. Use this when users need detailed information, code examples, specifications, or comprehensive explanations. Use this for fetching documentation after performing a search. Ideal for learning concepts in-depth, understanding API signatures, or when teaching web development topics.

`get-compat`: Retrieves detailed Browser Compatibility Data (BCD) for a specific web platform feature. Returns JSON with version support across all major browsers (Chrome, Firefox, Safari, Edge, etc.) including desktop and mobile variants. Use this after obtaining a \`compat-key\` from the \`search\` or \`get-doc\` tools - do NOT guess BCD keys.
