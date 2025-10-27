import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { createClient, createServer } from "../helpers/client.js";

describe("get-doc tool", () => {
  /** @type {Awaited<ReturnType<createServer>>} */
  let server;
  /** @type {Awaited<ReturnType<createClient>>} */
  let client;

  before(async () => {
    server = await createServer();
    client = await createClient(server.port);
  });

  it("should be callable", async () => {
    const { content } = await client.callTool({
      name: "get-doc",
    });
    assert.deepEqual(content, []);
  });

  after(() => {
    server.listener.close();
  });
});
