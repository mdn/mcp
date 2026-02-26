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

  after(() => {
    server.listener.close();
  });
});
