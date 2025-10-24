import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { createClient, createServer } from "./helpers/client.js";

describe("server", () => {
  /** @type {ReturnType<createServer>} */
  let server;
  /** @type {Awaited<ReturnType<createClient>>} */
  let client;

  before(async () => {
    server = createServer(3003);
    client = await createClient(3003);
  });

  it("should be named mdn", async () => {
    const name = client.getServerVersion()?.name;
    assert.equal(name, "mdn");
  });

  it("should accept ping", async () => {
    const ping = await client.ping();
    assert.deepEqual(ping, {});
  });

  after(() => {
    server.close();
  });
});
