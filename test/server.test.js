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
      }
    }
  });

  after(() => {
    server.listener.close();
  });
});
