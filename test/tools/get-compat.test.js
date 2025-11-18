/* eslint-disable jsdoc/reject-any-type */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { MockAgent, setGlobalDispatcher } from "undici";

import arrayCompat from "../fixtures/bcd-array.json" with { type: "json" };
import { createClient, createServer } from "../helpers/client.js";

describe("get-compat tool", () => {
  /** @type {Awaited<ReturnType<createServer>>} */
  let server;
  /** @type {Awaited<ReturnType<createClient>>} */
  let client;
  /** @type {import("undici").MockPool} */
  let mockPool;

  before(async () => {
    server = await createServer();
    client = await createClient(server.port);

    const agent = new MockAgent();
    setGlobalDispatcher(agent);
    // only allow unmocked requests to the mcp server:
    agent.enableNetConnect(`localhost:${server.port}`);
    mockPool = agent.get("https://bcd.developer.mozilla.org");
  });

  it("should return bcd data", async () => {
    const key = "javascript.builtins.Array.Array";

    mockPool
      .intercept({
        path: `/bcd/api/v0/current/${key}.json`,
        method: "GET",
      })
      .reply(200, arrayCompat);

    /** @type {any} */
    const { content } = await client.callTool({
      name: "get-compat",
      arguments: {
        key,
      },
    });
    /** @type {string} */
    const text = content[0].text;
    const data = JSON.parse(text);
    assert.deepEqual(data.__compat.support.firefox[0].version_added, "1");
  });

  it("should handle invalid key", async () => {
    const key = "javascript.builtins.Array.foobar";

    mockPool
      .intercept({
        path: `/bcd/api/v0/current/${key}.json`,
        method: "GET",
      })
      .reply(404);

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
  });

  it("should handle invalid root key", async () => {
    const key = "foobar";

    mockPool
      .intercept({
        path: `/bcd/api/v0/current/${key}.json`,
        method: "GET",
      })
      .reply(404);

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
  });

  it("should handle bcd api server error", async () => {
    const key = "javascript.builtins.Array.Array";

    mockPool
      .intercept({
        path: `/bcd/api/v0/current/${key}.json`,
        method: "GET",
      })
      .reply(500);

    /** @type {any} */
    const { content, isError } = await client.callTool({
      name: "get-compat",
      arguments: {
        key,
      },
    });

    assert.deepEqual(isError, true);
    /** @type {string} */
    const text = content[0].text;
    assert.ok(text.startsWith("Error:"), "response starts with 'Error:'");
  });

  after(() => {
    server.listener.close();
  });
});
