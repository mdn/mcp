import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { createClient, createServer } from "../helpers/client.js";

describe("all tools", () => {
  /** @type {Awaited<ReturnType<createServer>>} */
  let server;
  /** @type {Awaited<ReturnType<createClient>>} */
  let client;

  before(async () => {
    server = await createServer();
    client = await createClient(server.port);
  });

  it("should have a title", async () => {
    const { tools } = await client.listTools();
    const without = tools
      .filter((tool) => !("title" in tool))
      .map(({ name }) => name);
    assert.ok(
      without.length === 0,
      `${without.join(", ")} tool(s) don't have a title`,
    );
  });

  after(() => {
    server.listener.close();
  });
});
