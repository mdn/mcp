# mdn-mcp

This is an experimental [MCP server](https://modelcontextprotocol.io/docs/learn/server-concepts) which provides access to MDN's search, documentation and Browser Compatibility Data.

Our hope is that it gives LLM ChatBots and Coding Agents more accurate information about the current state of the web rather than relying the vast amount of out-of-date information on the Internet.

## Privacy and Data Retention

This MCP is being run as an experiment. While it is an experiment, we will be storing data about the queries we receive. Please see our [privacy notice](https://www.mozilla.org/en-US/privacy/websites/) for more information on interaction data we may collect. This data will **not** be associated with any information designed to identify users. However, while unlikely, it is possible that private information that you divulge to the LLM could be included in these queries. Please don't use this MCP if this is a concern to you.

To opt out of first-party analytics, send the `X-Moz-1st-Party-Data-Opt-Out: 1` header along with requests to the MCP.

By using our MCP, you agree to comply with our [Acceptable Usage Policy](https://www.mozilla.org/en-US/about/legal/acceptable-use/).

As this MCP is experimental it may be withdrawn at any time.

## Using the remote server

Add the remote server to your tool of choice, e.g. in Claude Code:

```
claude mcp add --transport http mdn https://mcp.mdn.mozilla.net/
```

## Using locally

- Install dependencies: `npm install`
- Start the server: `npm start`

Add the server to your tool of choice, e.g. in Claude Code:

```
claude mcp add --transport http mdn-local http://localhost:3002/
```

## Local development

- Install dependencies: `npm install`
- Start the development server, MCP inspector and tests: `npm run dev`
- Your browser should automatically open the MCP inspector, and the server will restart when you make changes
