import { publicClient } from "../config/web3config.js";
import { query } from "../config/db.js";
import {
  Bytes32,
  Bytes32Schema,
  Address,
} from "../lib/types/solidity.types.js";
import { parseEventLogs } from "viem";
import { event_LedgerCreated } from "../lib/abi/evidence-ledger-abi.js";
import { bigIntToTimeStamp } from "../lib/util/acitivtyHelpers.js";
import { config } from "../config/config.js";

export async function upsertEvidenceLedgerInfo(_txHash: Bytes32) {
  const result = Bytes32Schema.safeParse(_txHash);
  if (!result.success) {
    throw new Error("Invalid Contract Address");
  }
  const txHash = _txHash.toLowerCase();

  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash as `0x${string}`,
    timeout: 10_000, // wait for 10 seconds
  });

  const eventLogs = parseEventLogs({
    abi: event_LedgerCreated,
    logs: receipt.logs,
    eventName: "EvidenceLedgerCreated",
  });
  if (eventLogs.length === 0) throw new Error("missing create event");
  const args = eventLogs[0].args;
  const contractAddress = args.contractAddress.toLowerCase() as Address;
  const chainId = config.CURRENT_CHAIN.id;
  const creator = args.creator.toLowerCase() as Address;
  const blockNumber = args.blockNumber as bigint;
  const createdAt = bigIntToTimeStamp(args.timeStamp);

  const ledgerId = `eip155:${chainId}:${contractAddress}`;
  console.log("ledgerinfo", [
    blockNumber,
    txHash,
    createdAt,
    creator,
    ledgerId,
  ]);

  await query(
    `
    UPDATE ledger_info 
    SET
      deployed_block = $2,
      created_at = $3,
      creator = $4,
      last_processed_block = $2,
      status = 'active',
      ledger_id = $5
    WHERE deployed_tx_hash = $1
    `,
    [txHash, blockNumber, createdAt, creator, ledgerId],
  );
}
