// sentry init must come first
import "./sentry/init.js";

import { fileURLToPath } from "node:url";

import * as Sentry from "@sentry/node";
import express from "express";

import handleRequest from "./transport.js";

const app = express();

app.all(["/", "/mcp"], (req, res, next) => {
  res.set("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.set(
      "Access-Control-Allow-Headers",
      "Content-Type, MCP-Protocol-Version, X-Moz-1st-Party-Data-Opt-Out",
    );
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json());

app.post(["/", "/mcp"], handleRequest);

app.get(["/", "/mcp"], (req, res) => {
  // Redirecting SSE clients to HTML can cause an endless reconnect loop.
  if (req.accepts(["html", "text/event-stream"]) === "text/event-stream") {
    res.set("Allow", "POST").sendStatus(405);
    return;
  }
  res.redirect(302, "https://developer.mozilla.org/en-US/mcp");
});

Sentry.setupExpressErrorHandler(app);

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
  console.log(`MDN MCP server running on http://localhost:${port}/`);
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
