import { getPublicClient } from "../../../configs/web3Config.js";
import { query } from "../../../configs/dbConfig.js";
import {
  Bytes32,
  Bytes32Schema,
  Address,
} from "../../../lib/types/solidity.types.js";
import { parseEventLogs } from "viem";
import { event_LedgerCreated } from "../../../lib/abi/evidence-ledger-abi.js";
import { bigIntToTimeStamp } from "../../../lib/util/acitivtyHelpers.js";
import { getIO } from "../../../configs/socketConfig.js";
import {
  PendingLedgerDbPayload,
  PendingLedgerDbPayloadSchema,
} from "../../../lib/types/ledger.types.js";

export async function validateLedger(data: PendingLedgerDbPayload) {
  const io = getIO();
  const parsed = PendingLedgerDbPayloadSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("invalid db ledger payload");
  }
  const txHash = parsed.data.txHash;
  const chainId = parsed.data.chainId;
  const creator = parsed.data.creator;
  const publicClient = getPublicClient(chainId);

  try {
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash as `0x${string}`,
      timeout: 10_000, // wait for 10 seconds
    });

    const eventLogs = parseEventLogs({
      abi: event_LedgerCreated,
      logs: receipt.logs,
      eventName: "EvidenceLedgerCreated",
    });
    if (eventLogs.length === 0)
      throw new Error("ledger config: missing ledger create event");
    const args = eventLogs[0].args;
    const contractAddress = args.contractAddress.toLowerCase() as Address;
    const creator = args.creator.toLowerCase() as Address;
    const blockNumber = args.blockNumber as bigint;
    const createdAt = bigIntToTimeStamp(args.timeStamp);

    const ledgerId = `eip155:${chainId}:${contractAddress}`;

    await query(
      `
    UPDATE ledger_info 
    SET
      deployed_block = $2,
      created_at = $3,
      creator = $4,
      last_processed_block = $2,
      status = 'active',
      ledger_id = $5,
      address = $6
    WHERE deployed_tx_hash = $1
    `,
      [txHash, blockNumber, createdAt, creator, ledgerId, contractAddress],
    );

    // only creator gets update for now
    io.to(creator).emit("ledger_update", {
      txHash: txHash,
      status: "active",
      id: ledgerId,
      creator: creator,
      createdAt: createdAt,
      address: contractAddress,
    });
    console.log("validateLedger: sent socket update for id", ledgerId);
  } catch (err) {
    console.error("validateLedger: db error", err);

    io.to(creator).emit("ledger_update", {
      txHash: txHash,
      status: "inactive",
    });

    await query(
      `
    UPDATE ledger_info 
    SET
      status = 'inactive',
    WHERE deployed_tx_hash = $1
    `,
      [txHash],
    );
    throw new Error("ledger validation failed: db error");
  }
}
