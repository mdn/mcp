import { fileURLToPath } from "node:url";

import express from "express";

import handleRequest from "./transport.js";

const app = express();
app.use(express.json());

app.post("/mcp", handleRequest);

const PORT = Number.parseInt(process.env.PORT || "3002");

/** @param {number} port */
export default function listen(port) {
  return app.listen(port, () => {
    console.log(`MDN MCP server running on http://localhost:${port}/mcp`);
  });
}

/* node:coverage disable */
if (fileURLToPath(import.meta.url) === process.argv[1]) {
  listen(PORT);
}
/* node:coverage enable */
