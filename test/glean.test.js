import assert from "node:assert/strict";
import { after, before, describe, it, mock } from "node:test";

import { silentError } from "../glean/generated/error.js";

import { createClient, createServer } from "./helpers/client.js";

describe("glean", () => {
  /** @type {Awaited<ReturnType<createServer>>} */
  let server;
  /** @type {Awaited<ReturnType<createClient>>} */
  let optOutClient;

  before(async () => {
    server = await createServer();
    optOutClient = await createClient(server.port, {
      requestInit: {
        headers: { "X-Moz-1st-Party-Data-Opt-Out": "1" },
      },
    });
  });

  it("should not record events when opt-out header is set", async () => {
    const record = mock.method(silentError, "record");

    await optOutClient.callTool({
      name: "get-doc",
      arguments: { path: "https://example.com" },
    });

    assert.equal(record.mock.calls.length, 0);
  });

  after(() => {
    server.listener.close();
  });
});
