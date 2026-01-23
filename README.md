# mdn-mcp

This is an experimental [MCP server](https://modelcontextprotocol.io/docs/learn/server-concepts) which provides access to MDN's search, documentation and Browser Compatibility Data.

Our hope is that it gives LLM ChatBots and Coding Agents more accurate information about the current state of the web rather than relying the vast amount of out-of-date information on the Internet.

## Privacy and Data Retention

This MCP is being run as an experiment. While it is an experiment, we will be storing data about the queries we receive. This data will **not** be associated with any information designed to identify users. However, while unlikely, it is possible that private information that you divulge to the LLM could be included in these queries. Please don't use this MCP if this is a concern to you.

As this MCP is experimental it may be withdrawn at any time, in particular, the URL will change before it becomes production ready.

## Using the remote server

Add the remote server to your tool of choice, e.g. in Claude Code:

```
claude mcp add --transport http mdn https://mdn-mcp-0445ad8e765a.herokuapp.com/mcp
```

## Using locally

- Install dependencies: `npm install`
- Start the server: `npm start`

Add the server to your tool of choice, e.g. in Claude Code:

```
claude mcp add --transport http mdn-local http://localhost:3002/mcp
```

## Local development

- Install dependencies: `npm install`
- Start the development server, MCP inspector and tests: `npm run dev`
- Your browser should automatically open the MCP inspector, and the server will restart when you make changes
