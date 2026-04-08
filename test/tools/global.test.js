import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { createClient, createServer } from "../helpers/client.js";

describe("all tools", () => {
  /** @type {Awaited<ReturnType<createServer>>} */
  let server;
  /** @type {Awaited<ReturnType<createClient>>} */
  let client;

  before(async () => {
    server = await createServer();
    client = await createClient(server.port);
  });

  it("should have a title", async () => {
    const { tools } = await client.listTools();
    const without = tools
      .filter((tool) => !("title" in tool))
      .map(({ name }) => name);
    assert.ok(
      without.length === 0,
      `${without.join(", ")} tool(s) don't have a title`,
    );
  });

  it("should be described in the MCP instructions", async () => {
    const instructions = client.getInstructions();
    const { tools } = await client.listTools();
    const without = tools
      .filter((tool) => !instructions?.includes(`\`${tool.name}\`: `))
      .map(({ name }) => name);
    assert.ok(
      without.length === 0,
      `${without.join(", ")} tool(s) aren't explained in the MCP instructions`,
    );
  });

  it("should have a description", async () => {
    const { tools } = await client.listTools();
    const without = tools
      .filter((tool) => !("description" in tool))
      .map(({ name }) => name);
    assert.ok(
      without.length === 0,
      `${without.join(", ")} tool(s) don't have a description`,
    );
  });

  it("should have annotations", async () => {
    // https://support.claude.com/en/articles/13145358-anthropic-software-directory-policy
    // E. MCP servers must provide all applicable annotations for their tools,
    // in particular readOnlyHint, destructiveHint, and title.
    const { tools } = await client.listTools();
    for (const tool of tools) {
      const { annotations } = tool;
      assert.equal(
        annotations?.title,
        tool.title,
        `${tool.name} annotations.title doesn't match title`,
      );
      for (const hint of /** @type {const} */ ([
        "readOnlyHint",
        "destructiveHint",
        "idempotentHint",
        "openWorldHint",
      ])) {
        assert.equal(
          typeof annotations?.[hint],
          "boolean",
          `${tool.name} annotations.${hint} is not defined`,
        );
      }
    }
  });

  it("should have arguments with descriptions", async () => {
    const { tools } = await client.listTools();
    for (const tool of tools) {
      const { properties } = tool.inputSchema;
      if (properties === undefined) throw new Error("arguments are undefined");
      const without = Object.entries(properties)
        .filter(
          // eslint-disable-next-line jsdoc/reject-any-type
          ([_, schema]) => !("description" in /** @type {any} */ (schema)),
        )
        .map(([name]) => name);
      assert.ok(
        without.length === 0,
        `${without.join(", ")} argument(s) don't have a description in tool ${tool.name}`,
      );
    }
  });

  after(() => {
    server.listener.close();
  });
});
