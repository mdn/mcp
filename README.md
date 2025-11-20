# mdn-mcp

This is an [MCP server](https://modelcontextprotocol.io/docs/learn/server-concepts) which provides access to MDN's search, documentation and Browser Compatibility Data.

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
