/* eslint-disable jsdoc/reject-any-type */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { createClient, createServer } from "../helpers/client.js";

describe("get-browser-compat tool", () => {
  /** @type {Awaited<ReturnType<createServer>>} */
  let server;
  /** @type {Awaited<ReturnType<createClient>>} */
  let client;

  before(async () => {
    server = await createServer();
    client = await createClient(server.port);
  });

  it("should be callable", async () => {
    /** @type {any} */
    const { content } = await client.callTool({
      name: "get-browser-compat",
      arguments: {
        key: "api.fetch",
      },
    });
    /** @type {string} */
    const text = content[0].text;
    assert.ok(text.includes("api.fetch"), "includes key");
  });

  after(() => {
    server.listener.close();
  });
});
