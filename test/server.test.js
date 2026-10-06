import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { createClient, createServer } from "./helpers/client.js";

describe("server", () => {
  /** @type {Awaited<ReturnType<createServer>>} */
  let server;
  /** @type {Awaited<ReturnType<createClient>>} */
  let client;

  before(async () => {
    server = await createServer();
    client = await createClient(server.port);
  });

  it("should be named mdn", async () => {
    const name = client.getServerVersion()?.name;
    assert.equal(name, "mdn");
  });

  it("should accept ping", async () => {
    const ping = await client.ping();
    assert.deepEqual(ping, {});
  });

  it("should still be accessible at /mcp", async () => {
    const clientLegacyPath = await createClient(server.port, "mcp");
    const ping = await clientLegacyPath.ping();
    assert.deepEqual(ping, {});
  });

  it("should redirect ordinary visits to the landing page", async () => {
    for (const path of ["/", "/mcp"]) {
      for (const accept of ["*/*", "text/html"]) {
        const res = await fetch(`http://localhost:${server.port}${path}`, {
          headers: { Accept: accept },
        });
        assert.ok(res.redirected);
        assert.strictEqual(res.url, "https://developer.mozilla.org/en-US/mcp");
      }
    }
  });

  it("should reject optional MCP notification streams without redirecting", async () => {
    for (const path of ["/", "/mcp"]) {
      for (const accept of [
        "text/event-stream",
        "application/json, text/event-stream",
      ]) {
        const res = await fetch(`http://localhost:${server.port}${path}`, {
          headers: { Accept: accept },
          redirect: "manual",
        });
        assert.equal(res.status, 405);
        assert.equal(res.headers.get("allow"), "POST");
        assert.equal(res.headers.get("location"), null);
        assert.equal(res.headers.get("access-control-allow-origin"), "*");
      }
    }
  });

  it("should allow browser MCP preflights", async () => {
    const res = await fetch(`http://localhost:${server.port}/`, {
      method: "OPTIONS",
      headers: {
        Origin: "https://example.com",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers":
          "content-type,mcp-protocol-version,x-moz-1st-party-data-opt-out",
      },
    });
    assert.equal(res.status, 204);
    assert.equal(res.headers.get("access-control-allow-origin"), "*");
    assert.equal(
      res.headers.get("access-control-allow-headers"),
      "Content-Type, MCP-Protocol-Version, X-Moz-1st-Party-Data-Opt-Out",
    );
  });

  it("should allow browsers to read MCP responses", async () => {
    const res = await fetch(`http://localhost:${server.port}/`, {
      method: "POST",
      headers: {
        Origin: "https://example.com",
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        "MCP-Protocol-Version": "2025-11-25",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping" }),
    });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("access-control-allow-origin"), "*");
    assert.deepEqual(await res.json(), { jsonrpc: "2.0", id: 1, result: {} });
  });

  it("should include CORS headers on JSON parsing errors", async () => {
    const res = await fetch(`http://localhost:${server.port}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    });
    assert.equal(res.status, 400);
    assert.equal(res.headers.get("access-control-allow-origin"), "*");
  });

  after(() => {
    server.listener.close();
  });
});
