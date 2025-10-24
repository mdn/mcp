import express from "express";

import handleRequest from "./transport.js";

const app = express();
app.use(express.json());

app.post("/mcp", handleRequest);

const PORT = Number.parseInt(process.env.PORT || "3002");
app.listen(PORT, () => {
  console.log(`MDN MCP server running on http://localhost:${PORT}/mcp`);
});
