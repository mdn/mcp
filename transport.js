import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import server from "./server.js";

/**
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
export default async function handleRequest(req, res) {
  const transport = new StreamableHTTPServerTransport({
    // stateless mode: we don't need to share context across requests
    sessionIdGenerator: undefined,
    // return JSON responses instead of SSE streams
    enableJsonResponse: true,
  });

  res.on("close", () => {
    transport.close();
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
}
