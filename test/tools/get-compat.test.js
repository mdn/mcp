/* eslint-disable jsdoc/reject-any-type */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { createClient, createServer } from "../helpers/client.js";

describe("get-compat tool", () => {
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
      name: "get-compat",
      arguments: {
        key: "javascript.builtins.Array.Array",
      },
    });
    /** @type {string} */
    const text = content[0].text;
    const data = JSON.parse(text);
    assert.deepEqual(data.__compat.support.firefox.version_added, "1");
  });

  it("should handle invalid key", async () => {
    const key = "javascript.builtins.Array.foobar";
    /** @type {any} */
    const { content } = await client.callTool({
      name: "get-compat",
      arguments: {
        key,
      },
    });
    /** @type {string} */
    const text = content[0].text;
    assert.ok(text.startsWith("Error:"), "response starts with 'Error:'");
    assert.ok(text.includes(key), "response includes key");
    assert.ok(
      text.includes(`"javascript.builtins.Array"`),
      "response includes last valid key",
    );
  });

  it("should handle invalid root key", async () => {
    const key = "foobar";
    /** @type {any} */
    const { content } = await client.callTool({
      name: "get-compat",
      arguments: {
        key,
      },
    });
    /** @type {string} */
    const text = content[0].text;
    assert.ok(text.startsWith("Error:"), "response starts with 'Error:'");
    assert.ok(text.includes(key), "response includes key");
    assert.ok(!text.includes(`""`), "response doesn't include last valid key");
  });

  after(() => {
    server.listener.close();
  });
});
