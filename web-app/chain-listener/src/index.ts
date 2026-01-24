import { config } from "./config/config.js";
import { logger } from "./logger.js";
import { createServer } from "node:http";
import { initSocket } from "./config/socket.js";
import { Client } from "pg";
import { validateActivity } from "./db/validateActivity.js";

const httpServer = createServer();
initSocket(httpServer);

// Separate connection just for listening (LISTEN/NOTIFY needs a dedicated connection)
const activityPgClient = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  logger.info("Booting chain-listener backend...");
  logger.info(`Using network: ${config.CURRENT_CHAIN.name}`);
  logger.info(`RPC URL: ${config.RPC_URL}`);
  logger.info(`Ledger address: ${config.LEDGER_CONTRACT_ADDRESS}`);

  await activityPgClient.connect();
  logger.info(`Connected to PgClient`);

  await activityPgClient.query("LISTEN pending_activity_channel");
  console.log("Listening for new pending activities...");

  activityPgClient.on("notification", async (msg) => {
    if (msg.channel === "pending_activity_channel" && msg.payload) {
      console.log("Activity detected, socket udpate receieved");
      const data = JSON.parse(msg.payload);
      const evidenceId = data.evidenceId;
      const activityId = BigInt(data.id);
      const type = data.type;
      const actor = data.actor;
      const txHash = data.txHash ? (data.txHash as `0x${string}`) : null;
      const blockNumber = data.blockNumber ? BigInt(data.blockNumber) : null;

      try {
        await validateActivity(
          evidenceId,
          activityId,
          type,
          actor,
          txHash,
          blockNumber,
        );
      } catch (err) {
        throw err;
      }
    }
  });

  const shutdown = async () => {
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});

httpServer.listen(4000, () => console.log("Server listening on 4000"));
