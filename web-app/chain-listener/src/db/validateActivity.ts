import { publicClient } from "../config/web3config.js";
import { query } from "../config/db.js";
import { logger } from "../logger.js";
import { getIO } from "../config/socket.js";
import {
  insertNewEvidence,
  updateTransferOwnership,
  updateEvidenceDiscontinued,
} from "./upsertEvidence.js";
import { ActivityType } from "../lib/types/activity.types.js";
import { Address, Bytes32 } from "../lib/types/solidity.types.js";
import { parseEventLogs, zeroAddress } from "viem";
import { evidenceLedgerAddress } from "../lib/evidence-ledger-address.js";
import {
  evidenceLedgerAbi,
  event_EvidenceCreated,
  event_OwnershipTransferred,
  event_EvidenceDiscontinued,
} from "../lib/abi/evidence-ledger-abi.js";

export type clientStatus = "client_only" | "failed";

/**
 * @dev 1. Activity validation is independent of upsertEvidence.
 *      2. First update the activity to valid after checks and then upsertEvidence.
 * @todo 1. emit socket event here to handle db failures
 *       2. maybe fallback if evidence does it not exist on chain.
 *       3. do some more receipt checks, make it robust
 */
export async function validateActivity(
  evidenceId: Bytes32,
  activityId: bigint,
  type: ActivityType,
  actor: Address,
  txHash: Bytes32 | null,
  blockNumber: bigint | null,
): Promise<void> {
  // activity stays pending if this happens, add a timeout if possible
  if (!activityId) {
    logger.error("validateActivity: query error, invalid activity Id.");
    throw new Error("db error: invalid activity id");
  }

  // check existence of evidence on chain first. or maybe do handle using receipts directly
  const contractAddress = (await publicClient.readContract({
    address: evidenceLedgerAddress,
    abi: evidenceLedgerAbi,
    functionName: "getEvidenceContractAddress",
    args: [evidenceId],
  })) as Address;

  if (!contractAddress || contractAddress === zeroAddress) {
    await updateActivityForClient(
      actor,
      activityId,
      "failed",
      txHash,
      blockNumber ?? null,
      "evidence not onchain",
    );
    // do some fallbacks here: like remove evidence from evidence table or update it etc.
    logger.warn(
      "validateActivity: evidence was not found on chain! marking activity as failed.",
      {
        evidenceId: evidenceId,
      },
    );
    return;
  }

  if (!txHash) {
    logger.warn(
      "validateActivity: txHash not provided, marking activity as failed.",
      {
        activityId: activityId,
      },
    );
    await updateActivityForClient(
      actor,
      activityId,
      "failed",
      null,
      blockNumber ?? null,
      "missing TxHash",
    );
    return;
  }

  let receipt;
  try {
    receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
      timeout: 10_000, // wait for 10 seconds
    });
  } catch (err) {
    logger.warn("validateActivity: fetching reciept failed:", {
      hash: txHash,
      originalError: err,
    });
    await updateActivityForClient(
      actor,
      activityId,
      "failed",
      txHash,
      blockNumber ?? null,
      "invalid receipt: timeout",
    );
    return;
  }
  const blockNumberFromReceipt = receipt.blockNumber ?? null;

  if (receipt.status !== "success") {
    logger.warn(
      "validateActivity: tx failed on chain according to the receipt",
      {
        hash: txHash,
      },
    );
    await updateActivityForClient(
      actor,
      activityId,
      "failed",
      txHash,
      blockNumberFromReceipt,
      "on chain failure",
    );
    return;
  }

  // check the contract events

  if (type === "create") {
    const eventLogs = parseEventLogs({
      abi: event_EvidenceCreated,
      logs: receipt.logs,
      eventName: "EvidenceCreated",
    });
    if (eventLogs.length === 0) {
      throw new Error("invalid receipt: missing contract create event");
    }
    const eventData = eventLogs[0].args;
    // also update account nonce
    await insertNewEvidence(
      eventData.metadataHash,
      eventData.contractAddress,
      eventData.evidenceId,
      eventData.creator,
      eventData.timeOfCreation,
      blockNumberFromReceipt,
      txHash,
      eventData.desc,
    );
    await updateActivityForClient(
      actor,
      activityId,
      "client_only",
      txHash,
      receipt.blockNumber,
    );
    return;
  } else if (type === "transfer") {
    const eventLogs = parseEventLogs({
      abi: event_OwnershipTransferred,
      logs: receipt.logs,
      eventName: "OwnershipTransferred",
    });
    if (eventLogs.length === 0) {
      throw new Error("invalid receipt: missing contract transfer event");
    }
    const eventData = eventLogs[0].args;
    await updateTransferOwnership(
      eventData.evidenceId,
      eventData.newOwner,
      txHash,
      blockNumberFromReceipt,
      eventData.timeOfTransfer,
    );
    await updateActivityForClient(
      actor,
      activityId,
      "client_only",
      txHash,
      receipt.blockNumber,
    );
    return;
  } else if (type === "discontinue") {
    const eventLogs = parseEventLogs({
      abi: event_EvidenceDiscontinued,
      logs: receipt.logs,
      eventName: "EvidenceDiscontinued",
    });
    if (eventLogs.length === 0) {
      throw new Error("invalid receipt: missing contract discontinue event");
    }
    const eventData = eventLogs[0].args;
    await updateEvidenceDiscontinued(
      eventData.evidenceId,
      txHash,
      blockNumberFromReceipt,
      eventData.timeOfDiscontinuation,
    );
    await updateActivityForClient(
      actor,
      activityId,
      "client_only",
      txHash,
      receipt.blockNumber,
    );
    return;
  } else {
    await updateActivityForClient(
      actor,
      activityId,
      "failed",
      txHash,
      receipt.blockNumber,
      `invalid activity: ${type}`,
    );
    throw new Error("invalid activity");
  }
}

/**
 * @notice internal function
 * @notice 1. Updates the activity to client_only(valid) / failed,
 */

async function updateActivityForClient(
  actor: Address,
  activityId: bigint,
  status: clientStatus,
  txHash: Bytes32 | null,
  blockNumber: bigint | null,
  error?: string,
) {
  let result;
  try {
    if (status === "failed") {
      result = await query(
        `
      UPDATE activity
      SET status = 'failed',
          updated_at = now(),
          tx_hash = $1,
          block_number = $2,
          meta = jsonb_set(
          COALESCE(meta, '{}'),
          '{error}',
          to_jsonb($3::text),
          true
        )
      WHERE id = $4
      RETURNING updated_at
      `,
        [
          txHash ? txHash.toLowerCase() : null,
          blockNumber ? blockNumber.toString() : null,
          String(error || "unknown error"),
          activityId.toString(),
        ],
      );
    } else if (status === "client_only" && txHash) {
      result = await query(
        `
      UPDATE activity
      SET status = 'client_only',
          tx_hash = $1,
          block_number = $2,
          updated_at = now()
      WHERE id = $3
      RETURNING updated_at
      `,
        [
          txHash.toLowerCase(),
          blockNumber ? blockNumber.toString() : null,
          activityId.toString(),
        ],
      );
    }
  } catch (err) {
    throw new Error("update activity failed: db error");
  }

  const updatedAt = result?.rows[0].updated_at as Date;

  // EMIT SOCKET EVENT
  const io = getIO();
  io.emit("activity:update", {
    activityId: activityId.toString(),
    status: status,
    account: actor,
    txHash: txHash ? txHash.toLowerCase() : null,
    updatedAt: updatedAt,
    error: error,
  });
  logger.info(
    `Emit Socket Event: "activity:update" to ${status} , ${error && "failed due to: " + error}`,
  );

  return;
}
