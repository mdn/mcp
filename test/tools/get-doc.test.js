/* eslint-disable jsdoc/reject-any-type */
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

  it("should fetch requested document", async () => {
    /** @type {any} */
    const { content } = await client.callTool({
      name: "get-doc",
      arguments: {
        path: "/en-US/docs/MDN/Kitchensink",
      },
    });
    const { mdn_url } = JSON.parse(content[0].text);
    assert.strictEqual(mdn_url, "/en-US/docs/MDN/Kitchensink");
  });

  after(() => {
    server.listener.close();
  });
});
