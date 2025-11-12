/* eslint-disable jsdoc/reject-any-type */
import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";

import { MockAgent, setGlobalDispatcher } from "undici";

import headersDoc from "../fixtures/headers.json" with { type: "json" };
import kitchensinkDoc from "../fixtures/kitchensink.json" with { type: "json" };
import { createClient, createServer } from "../helpers/client.js";

describe("get-doc tool", () => {
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

  describe("path param", () => {
    beforeEach(() => {
      mockPool
        .intercept({
          path: "/en-US/docs/MDN/Kitchensink/index.json",
          method: "GET",
        })
        .reply(200, kitchensinkDoc);
    });

    it("should accept normal path", async () => {
      /** @type {any} */
      const { content } = await client.callTool({
        name: "get-doc",
        arguments: {
          path: "/en-US/docs/MDN/Kitchensink",
        },
      });
      /** @type {string} */
      const text = content[0].text;
      assert.ok(text.startsWith("# The MDN Content Kitchensink"));
    });

    it("should accept full path", async () => {
      /** @type {any} */
      const { content } = await client.callTool({
        name: "get-doc",
        arguments: {
          path: "https://developer.mozilla.org/en-US/docs/MDN/Kitchensink",
        },
      });
      /** @type {string} */
      const text = content[0].text;
      assert.ok(text.startsWith("# The MDN Content Kitchensink"));
    });

    it("should accept path with index.json", async () => {
      /** @type {any} */
      const { content } = await client.callTool({
        name: "get-doc",
        arguments: {
          path: "/en-US/docs/MDN/Kitchensink/index.json",
        },
      });
      /** @type {string} */
      const text = content[0].text;
      assert.ok(text.startsWith("# The MDN Content Kitchensink"));
    });

    it("should accept path without locale", async () => {
      mockPool
        .intercept({
          path: "/docs/MDN/Kitchensink/index.json",
          method: "GET",
        })
        .reply(302, "", {
          headers: {
            location: "/en-US/docs/MDN/Kitchensink/index.json",
          },
        });

      /** @type {any} */
      const { content } = await client.callTool({
        name: "get-doc",
        arguments: {
          path: "/docs/MDN/Kitchensink",
        },
      });
      /** @type {string} */
      const text = content[0].text;
      assert.ok(text.startsWith("# The MDN Content Kitchensink"));
    });

    it("should accept path without leading slash", async () => {
      /** @type {any} */
      const { content } = await client.callTool({
        name: "get-doc",
        arguments: {
          path: "en-US/docs/MDN/Kitchensink",
        },
      });
      /** @type {string} */
      const text = content[0].text;
      assert.ok(text.startsWith("# The MDN Content Kitchensink"));
    });

    it("should reject wrong base url", async () => {
      const path = "https://example.com/en-US/docs/MDN/Kitchensink";
      /** @type {any} */
      const { content } = await client.callTool({
        name: "get-doc",
        arguments: {
          path,
        },
      });
      /** @type {string} */
      const text = content[0].text;
      assert.deepEqual(text, `Error: ${path} doesn't look like an MDN url`);
    });

    it("should handle path to missing doc", async () => {
      const path = "/en-US/docs/MDN/Knisnehctik";

      mockPool
        .intercept({
          path: path + "/index.json",
          method: "GET",
        })
        .reply(404);

      /** @type {any} */
      const { content } = await client.callTool({
        name: "get-doc",
        arguments: {
          path,
        },
      });
      /** @type {string} */
      const text = content[0].text;
      assert.deepEqual(text, `404: Not Found for ${path}`);
    });

    it("should reject non-doc path", async () => {
      const path = "/en-US/observatory";
      /** @type {any} */
      const { content } = await client.callTool({
        name: "get-doc",
        arguments: {
          path,
        },
      });
      /** @type {string} */
      const text = content[0].text;
      assert.deepEqual(
        text,
        `Error: ${path} doesn't look like the path to a piece of MDN documentation`,
      );
    });
  });

  it("should work with real document", async () => {
    mockPool
      .intercept({
        path: "/en-US/docs/Web/API/Headers/index.json",
        method: "GET",
      })
      .reply(200, headersDoc);

    /** @type {any} */
    const { content, isError } = await client.callTool({
      name: "get-doc",
      arguments: {
        path: "/en-US/docs/Web/API/Headers",
      },
    });
    assert.equal(isError, undefined);
    /** @type {string} */
    const text = content[0].text;
    assert.ok(text.startsWith("# Headers"));
  });

  after(() => {
    server.listener.close();
  });
});
