import { createServer } from "node:http";
import { initSocket } from "./socket";
import { logger } from "./logger";
import { config } from "./config";
import { Client } from "pg";
import { dispatchActivity } from "./dispatchers/dispatchActivity";

const httpServer = createServer();
initSocket(httpServer);

// Separate connection just for listening (LISTEN/NOTIFY needs a dedicated connection)
const pgClient = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  logger.info("Booting chain-listener backend...");
  logger.info(`Using network: ${config.CURRENT_CHAIN.name}`);
  logger.info(`RPC URL: ${config.RPC_URL}`);
  logger.info(`Ledger address: ${config.LEDGER_CONTRACT_ADDRESS}`);

  await pgClient.connect();
  logger.info(`Connected to PgClient`);

  // Start listening to the channel
  await pgClient.query("LISTEN new_pending_activity_channel");
  console.log("Listening for new pending activities...");

  // Handle the notification
  pgClient.on("notification", async (msg) => {
    if (msg.channel === "pending_activity_channel" && msg.payload) {
      const data = JSON.parse(msg.payload);
      const activityId = BigInt(data.id);
      const txHash = data.txHash ? (data.txHash as `0x${string}`) : null;
      const blockNumber = data.blockNumber ? BigInt(data.blockNumber) : null;

      logger.info(
        `New Activity Detected ID: ${activityId} | Hash: ${txHash} | Block: ${blockNumber}`
      );
      try {
        await dispatchActivity(activityId, txHash, blockNumber);
      } catch (err) {
        logger.error("Error processing notification payload:", err);
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
