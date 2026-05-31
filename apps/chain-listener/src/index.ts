import { createServer } from "node:http";
import { initSocket } from "./configs/socketConfig.js";
import { Client } from "pg";
import { validateActivity } from "./blockListeners/validators/activity/validateActivity.js";
import { validateLedger } from "./blockListeners/validators/ledgers/validateLedger.js";
import { validateRoles } from "./blockListeners/validators/ledgers/validateRoles.js";
import { Address } from "./lib/types/solidity.types.js";

const httpServer = createServer();
const io = initSocket(httpServer);

io.on("connection", (socket) => {
  // console.info("-------------New client connected:--------------", socket.id);

  socket.on("connect_account", (accountAddress: Address) => {
    if (!accountAddress) {
      return;
    }
    const roomName = accountAddress.toLowerCase();
    socket.join(roomName);
    // console.info(`Socket ${socket.id} joined room: ${roomName}`);
  });
  socket.on("disconnect_account", (accountAddress: Address) => {
    if (!accountAddress) return;
    const roomName = accountAddress.toLowerCase();
    socket.leave(roomName);
    // console.info(`Socket ${socket.id} left room: ${roomName}`);
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

  await dbListener.connect();
  console.info(`Connected to PgClient`);

  await dbListener.query("LISTEN pending_activity_channel");
  await dbListener.query("LISTEN new_ledger");
  await dbListener.query("LISTEN pending_roles_channel");
  console.log("Listening for Pending: Ledgers, Roles, Activities... ");

  dbListener.on("notification", async (msg) => {
    if (!msg.payload) return;
    if (msg.channel === "new_ledger") {
      const data = JSON.parse(msg.payload);
      await validateLedger(data);
    } else if (msg.channel === "pending_roles_channel") {
      const data = JSON.parse(msg.payload);
      await validateRoles(data);
    } else if (msg.channel === "pending_activity_channel") {
      const data = JSON.parse(msg.payload);
      await validateActivity(data);
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
