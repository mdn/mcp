import { fileURLToPath } from "node:url";

import express from "express";

import "./tools/search.js";
import "./tools/get-doc.js";
import handleRequest from "./transport.js";

const app = express();
app.use(express.json());

app.post("/mcp", handleRequest);

const PORT = Number.parseInt(process.env.PORT || "3002");

/** @param {number} requestedPort */
export default async function listen(requestedPort) {
  const listener = app.listen(requestedPort);
  await new Promise((resolve) => {
    listener.on("listening", resolve);
  });
  const address = listener.address();

  /* node:coverage disable */
  if (typeof address === "string" || !address) {
    throw new Error("server isn't listening on port");
  }
  /* node:coverage enable */

  const { port } = address;
  console.log(`MDN MCP server running on http://localhost:${port}/mcp`);
  return {
    listener,
    port,
  };
}

/* node:coverage disable */
if (fileURLToPath(import.meta.url) === process.argv[1]) {
  await listen(PORT);
}
/* node:coverage enable */
