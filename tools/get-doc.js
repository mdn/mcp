import server from "../server.js";

server.registerTool("get-doc", {}, async () => {
  return {
    content: [],
  };
});
