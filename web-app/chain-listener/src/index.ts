import { config } from "./config/config.js";
import { createServer } from "node:http";
import { initSocket } from "./config/socket.js";
import { Client } from "pg";
import { validateActivity } from "./blockListeners/validators/activity/validateActivity.js";
import { upsertEvidenceLedgerInfo } from "./db/upsertEvidenceLedgerInfo.js";
import { Address } from "./lib/types/solidity.types.js";

const httpServer = createServer();
const io = initSocket(httpServer);

io.on("connection", (socket) => {
  console.info("-------------New client connected:--------------", socket.id);

  socket.on("connect_account", (accountAddress: Address) => {
    if (!accountAddress) {
      return;
    }
    const roomName = accountAddress.toLowerCase();
    socket.join(roomName);
    console.info(`Socket ${socket.id} joined room: ${roomName}`);
  });
  socket.on("disconnect_account", (accountAddress: Address) => {
    if (!accountAddress) return;
    const roomName = accountAddress.toLowerCase();
    socket.leave(roomName);
    console.info(`Socket ${socket.id} left room: ${roomName}`);
  });

  socket.on("disconnect", () => {
    console.log("client disconnected:", socket.id);
  });
});

// Separate connection just for listening (LISTEN/NOTIFY needs a dedicated connection)
const dbListener = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  console.info("Booting chain-listener ...");
  console.info(`Using network: ${config.CURRENT_CHAIN.name}`);
  console.info(`RPC URL: ${config.RPC_URL}`);

  await dbListener.connect();
  console.info(`Connected to PgClient`);

  await dbListener.query("LISTEN pending_activity_channel");
  await dbListener.query("LISTEN new_ledger");
  console.log("Listening for new ledgers and pending activities...");

  dbListener.on("notification", async (msg) => {
    if (!msg.payload) return;
    if (msg.channel === "pending_activity_channel") {
      const data = JSON.parse(msg.payload);
      const evidenceId = data.evidenceId;
      const activityId = BigInt(data.id);
      const type = data.type;
      const actor = data.actor;
      const txHash = data.txHash ? (data.txHash as `0x${string}`) : null;
      const blockNumber = data.blockNumber ? BigInt(data.blockNumber) : null;

      try {
        //@todo pass raw data here later on, or parse it using zod beforehand
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
    } else if (msg.channel === "new_ledger") {
      await upsertEvidenceLedgerInfo(msg.payload as `0x${string}`);
    } else {
      console.warn(`Caught notification for unknown channel: ${msg.channel}`);
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
