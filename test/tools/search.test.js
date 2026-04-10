/* eslint-disable jsdoc/reject-any-type */
import assert from "node:assert/strict";
import { after, before, describe, it, mock } from "node:test";

import { MockAgent, setGlobalDispatcher } from "undici";

import { completed } from "../../glean/generated/search.js";
import clipboardApiMetadata from "../fixtures/clipboard-api-metadata.json" with { type: "json" };
import clipboardMetadata from "../fixtures/clipboard-metadata.json" with { type: "json" };
import searchResultEmpty from "../fixtures/search-result-empty.json" with { type: "json" };
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

  it("should return results", async () => {
    mockPool
      .intercept({
        path: "/api/v1/search?q=clipboard+api",
        method: "GET",
      })
      .reply(200, searchResult);
    mockPool
      .intercept({
        path: "/en-US/docs/Web/API/Clipboard/metadata.json",
        method: "GET",
      })
      .reply(500);

    /** @type {any} */
    const { content } = await client.callTool({
      name: "search",
      arguments: {
        query: "clipboard api",
      },
    });
    /** @type {string} */
    const text = content[0].text;
    assert.ok(
      text.includes("/en-US/docs/Web/API/Clipboard_API"),
      "includes result url",
    );
    assert.ok(text.includes("# Clipboard API"), "includes result title");
    assert.ok(
      text.includes(
        "The Clipboard API provides the ability to respond to clipboard commands (cut, copy, and paste), as well as to asynchronously read from and write to the system clipboard.",
      ),
      "includes result summary",
    );
  });

  it("should gracefully handle no results", async () => {
    const query = "testempty";
    mockPool
      .intercept({
        path: `/api/v1/search?q=${query}`,
        method: "GET",
      })
      .reply(200, searchResultEmpty);

    /** @type {any} */
    const { content } = await client.callTool({
      name: "search",
      arguments: {
        query,
      },
    });
    /** @type {string} */
    const text = content[0].text;
    assert.ok(text.includes(query), "response includes query");
    assert.ok(
      text.toLowerCase().includes("no results"),
      "response mentions no results",
    );
  });

  it("should gracefully handle server error", async () => {
    const query = "error";
    mockPool
      .intercept({
        path: `/api/v1/search?q=${query}`,
        method: "GET",
      })
      .reply(502);

    /** @type {any} */
    const { content } = await client.callTool({
      name: "search",
      arguments: {
        query,
      },
    });
    /** @type {string} */
    const text = content[0].text;
    assert.ok(text.includes("502"), "response includes error code");
    assert.ok(text.includes(query), "response includes query");
    assert.ok(text.includes("try again"), "response suggests next action");
  });

  it("should include single compat key", async () => {
    mockPool
      .intercept({
        path: "/api/v1/search?q=clipboard+api",
        method: "GET",
      })
      .reply(200, searchResult);
    mockPool
      .intercept({
        path: "/en-US/docs/Web/API/Clipboard/metadata.json",
        method: "GET",
      })
      .reply(200, clipboardMetadata);

    /** @type {any} */
    const { content } = await client.callTool({
      name: "search",
      arguments: {
        query: "clipboard api",
      },
    });
    /** @type {string} */
    const text = content[0].text;
    assert.ok(
      text.includes("`compat-key`: `api.Clipboard`"),
      "includes compat key",
    );
  });

  it("should include multiple compat keys", async () => {
    mockPool
      .intercept({
        path: "/api/v1/search?q=clipboard+api",
        method: "GET",
      })
      .reply(200, searchResult);
    mockPool
      .intercept({
        path: "/en-US/docs/Web/API/Clipboard_API/metadata.json",
        method: "GET",
      })
      .reply(200, clipboardApiMetadata);

    /** @type {any} */
    const { content } = await client.callTool({
      name: "search",
      arguments: {
        query: "clipboard api",
      },
    });
    /** @type {string} */
    const text = content[0].text;
    assert.ok(
      text.includes(
        "`compat-keys`: `api.Clipboard`, `api.ClipboardEvent`, `api.ClipboardItem`",
      ),
      "includes compat keys",
    );
  });

  describe("glean", () => {
    it("should send completed event with result count", async () => {
      const record = mock.method(completed, "record");

      mockPool
        .intercept({
          path: "/api/v1/search?q=clipboard+api",
          method: "GET",
        })
        .reply(200, searchResult);
      mockPool
        .intercept({
          path: "/en-US/docs/Web/API/Clipboard/metadata.json",
          method: "GET",
        })
        .reply(500);

      await client.callTool({
        name: "search",
        arguments: { query: "clipboard api" },
      });

      assert.equal(record.mock.calls.length, 1);
      assert.deepEqual(record.mock.calls[0]?.arguments[0], {
        result_count: 4197,
        top_score: 252,
        top_path: "/en-US/docs/Web/API/Clipboard_API",
        user_agent: "node",
      });
    });

    it("should send completed event with zero result count", async () => {
      const record = mock.method(completed, "record");

      mockPool
        .intercept({
          path: "/api/v1/search?q=testempty",
          method: "GET",
        })
        .reply(200, searchResultEmpty);

      await client.callTool({
        name: "search",
        arguments: { query: "testempty" },
      });

      assert.equal(record.mock.calls.length, 1);
      assert.deepEqual(record.mock.calls[0]?.arguments[0], {
        result_count: 0,
        user_agent: "node",
      });
    });
  });

  after(() => {
    server.listener.close();
  });
});
