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
import { bigIntToTimeStamp } from "./acitivtyHelpers.js";

export type clientStatus = "client_only" | "failed";

/**
 * @dev  1. accepts the pending activity from index
 *       2. fetches txReceipt (can take time depending on chain)
 *       3. checks the events and matches with contract abi
 *       4. inserts/updates evidences in evidence table
 *       5. updates activity to client_only if no error/ to failed if error
 *       6. emits socket event on update with necessary info
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
  const io = getIO();
  let updatedAt;
  let socketExtras: Record<string, any> = {};
  const recipients = new Set<string>();

  try {
    if (!activityId) {
      logger.error("validateActivity: query error, invalid activity Id.");
      throw new Error("db error: invalid activity id");
    }
    const contractAddress = (await publicClient.readContract({
      address: evidenceLedgerAddress,
      abi: evidenceLedgerAbi,
      functionName: "getEvidenceContractAddress",
      args: [evidenceId],
    })) as Address;

    if (!contractAddress || contractAddress === zeroAddress) {
      // todo some fallbacks here: like remove evidence from evidence table or update it etc.
      throw new Error("evidence not onchain");
    }

    if (!txHash) {
      throw new Error("missing TxHash");
    }

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
      timeout: 10_000, // wait for 10 seconds
    });
    const blockNumberFromReceipt = receipt.blockNumber ?? null;

    if (receipt.status !== "success") {
      throw new Error("on chain failure");
    }

    // activity update must go to actor at least
    recipients.add(actor.toLowerCase());
    if (type === "create") {
      const eventLogs = parseEventLogs({
        abi: event_EvidenceCreated,
        logs: receipt.logs,
        eventName: "EvidenceCreated",
      });
      if (eventLogs.length === 0) throw new Error("missing create event");
      const args = eventLogs[0].args;

      updatedAt = await insertNewEvidence(
        args.metadataHash,
        args.contractAddress,
        args.evidenceId,
        args.creator,
        args.timeOfCreation,
        blockNumberFromReceipt,
        txHash,
        args.desc,
      );

      socketExtras = {
        createdAt: bigIntToTimeStamp(args.timeOfCreation),
        desc: args.desc,
      };
    } else if (type === "transfer") {
      const eventLogs = parseEventLogs({
        abi: event_OwnershipTransferred,
        logs: receipt.logs,
        eventName: "OwnershipTransferred",
      });
      if (eventLogs.length === 0) throw new Error("missing transfer event");
      const args = eventLogs[0].args;
      const newOwner = args.newOwner.toLowerCase();
      updatedAt = await updateTransferOwnership(
        args.evidenceId,
        newOwner,
        txHash,
        blockNumberFromReceipt,
        args.timeOfTransfer,
      );
      socketExtras = {
        toAddr: newOwner,
        transferredAt: bigIntToTimeStamp(args.timeOfTransfer),
      };
      recipients.add(newOwner);
    } else if (type === "discontinue") {
      const eventLogs = parseEventLogs({
        abi: event_EvidenceDiscontinued,
        logs: receipt.logs,
        eventName: "EvidenceDiscontinued",
      });
      if (eventLogs.length === 0) throw new Error("missing discontinue event");
      const args = eventLogs[0].args;
      const currentOwner = args.currentOwner.toLowerCase();
      updatedAt = await updateEvidenceDiscontinued(
        args.evidenceId,
        txHash,
        blockNumberFromReceipt,
        args.timeOfDiscontinuation,
      );
      socketExtras = {
        discontinuedAt: bigIntToTimeStamp(args.timeOfDiscontinuation),
        currentOwner: currentOwner,
      };
      recipients.add(currentOwner);
    } else {
      throw new Error(`invalid activity: ${type}`);
    }
    await updateActivityForClient(
      activityId,
      "client_only",
      txHash,
      receipt.blockNumber,
      undefined,
      updatedAt,
    );
    logger.info(`Emitting Socket Event: "activity_update to client only"`, {
      recipients: Array.from(recipients),
    });

    // incase of type transfer/discontinue , also send it to the toAddr/currentowner resp.
    io.to(Array.from(recipients)).emit("activity_update", {
      account: actor,
      evidenceId: evidenceId,
      type: type,
      status: "client_only",
      activityId: activityId.toString(),
      txHash: txHash ? txHash.toLowerCase() : null,
      updatedAt: updatedAt,
      ...socketExtras,
    });
  } catch (err) {
    logger.info(
      `Emitting Socket Event: "activity_update to failed" ${err && ",failed due to: " + err}`,
      {
        account: actor,
      },
    );
    updatedAt = await updateActivityForClient(
      activityId,
      "failed",
      txHash,
      blockNumber,
      String(err),
      updatedAt,
    );
    io.to(actor).emit("activity_update", {
      account: actor,
      evidenceId: evidenceId,
      type: type,
      status: "failed",
      activityId: activityId.toString(),
      txHash: txHash ? txHash.toLowerCase() : null,
      updatedAt: updatedAt,
      error: err,
    });
  }
}

async function updateActivityForClient(
  activityId: bigint,
  status: clientStatus,
  txHash: Bytes32 | null,
  blockNumber: bigint | null,
  error?: string,
  evidenceUpsertUpdatedAt?: Date,
) {
  try {
    if (status === "failed") {
      const result = await query(
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
      return result.rows[0].updated_at;
    } else if (status === "client_only" && txHash) {
      await query(
        `
      UPDATE activity
      SET status = 'client_only',
          tx_hash = $1,
          block_number = $2,
          updated_at = COALESCE($4, NOW())
      WHERE id = $3
      `,
        [
          txHash.toLowerCase(),
          blockNumber ? blockNumber.toString() : null,
          activityId.toString(),
          evidenceUpsertUpdatedAt || null,
        ],
      );
    }
  } catch (err) {
    logger.error("updateActivityForClient: db error", err);
    throw new Error("db error");
  }
}
