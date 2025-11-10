/* eslint-disable jsdoc/reject-any-type */
import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";

import { MockAgent, setGlobalDispatcher } from "undici";

import docFixture from "../fixtures/kitchensink.json" with { type: "json" };
import { createClient, createServer } from "../helpers/client.js";

describe("get-doc tool", () => {
  /** @type {Awaited<ReturnType<createServer>>} */
  let server;
  /** @type {Awaited<ReturnType<createClient>>} */
  let client;
  /** @type {MockAgent} */
  let agent;

  before(async () => {
    server = await createServer();
    client = await createClient(server.port);
  });

  beforeEach(() => {
    agent = new MockAgent();
    setGlobalDispatcher(agent);
  });

  it("should fetch requested document from mock", async () => {
    agent
      .get("https://developer.mozilla.org")
      .intercept({
        path: "/en-US/docs/MDN/Kitchensink/index.json",
        method: "GET",
      })
      .reply(200, docFixture);

    /** @type {any} */
    const { content } = await client.callTool({
      name: "get-doc",
      arguments: {
        path: "/en-US/docs/MDN/Kitchensink",
      },
    });
    /** @type {string} */
    const text = content[0].text;
    assert.ok(text.includes("<h1>The MDN Content Kitchensink</h1>"));
  });

  after(() => {
    server.listener.close();
  });
});
