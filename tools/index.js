import { registerGetCompatTool } from "./get-compat.js";
import { registerGetDocTool } from "./get-doc.js";
import { registerSearchTool } from "./search.js";

/** @param {InstanceType<import("../server.js").ExtendedServer>} server */
export function registerTools(server) {
  registerGetCompatTool(server);
  registerGetDocTool(server);
  registerSearchTool(server);
}
