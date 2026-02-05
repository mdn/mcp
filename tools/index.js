import { registerGetCompatTool } from "./get-compat.js";
import { registerGetDocTool } from "./get-doc.js";
import { registerSearchTool } from "./search.js";

/** @param {import("../server.js").default} server */
export function registerTools(server) {
  registerGetCompatTool(server);
  registerGetDocTool(server);
  registerSearchTool(server);
}
