import { concurrently } from "concurrently";

concurrently(
  [
    {
      command: `npm run dev:server`,
      name: "mcp",
      prefixColor: "green",
    },
    {
      command: `npm run dev:inspector`,
      name: "inspector",
      prefixColor: "blue",
    },
  ],
  {
    killOthersOn: ["failure", "success"],
    restartTries: 0,
  },
);
