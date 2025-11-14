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

  it("should return bcd data", async () => {
    /** @type {any} */
    const { content } = await client.callTool({
      name: "get-browser-compat",
      arguments: {
        key: "javascript.builtins.Array.Array",
      },
    });
    /** @type {string} */
    const text = content[0].text;
    const data = JSON.parse(text);
    assert.deepEqual(data.__compat.support.firefox.version_added, "1");
  });

  after(() => {
    server.listener.close();
  });
});
