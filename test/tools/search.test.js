/* eslint-disable jsdoc/reject-any-type */
import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { MockAgent, setGlobalDispatcher } from "undici";

import searchResult from "../fixtures/search-result.json" with { type: "json" };
import { createClient, createServer } from "../helpers/client.js";

describe("search tool", () => {
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
    mockPool = agent.get("https://developer.mozilla.org");
  });

  it("should pass query to search api", async () => {
    mockPool
      .intercept({
        path: "/api/v1/search?q=test",
        method: "GET",
      })
      .reply(200, searchResult);

    /** @type {any} */
    const { content } = await client.callTool({
      name: "search",
      arguments: {
        query: "test",
      },
    });
    /** @type {string} */
    const text = content[0].text;
    assert.ok(
      text.includes("/en-US/docs/Web/XML/EXSLT/Reference/regexp/test"),
      "includes result url",
    );
  });

  after(() => {
    server.listener.close();
  });
});
