import { publicClient } from "../config/web3config.js";
import { query } from "../config/db.js";
import { getIO } from "../config/socket.js";
import {
  insertNewEvidence,
  updateTransferOwnership,
  updateEvidenceDiscontinued,
} from "./upsertEvidence.js";
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
import { ActivityTypeType } from "../lib/types/activity.types.js";
import { SocketEvidenceDetails } from "../lib/types/evidence.types.js";

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
  type: ActivityTypeType,
  actor: Address,
  txHash: Bytes32 | null,
  blockNumber: bigint | null,
): Promise<void> {
  const io = getIO();
  let updatedAt: bigint;
  const recipients = new Set<string>();
  // making sure
  actor = actor.toLowerCase() as Address;
  try {
    if (!activityId) {
      console.error("validateActivity: query error, invalid activity Id.");
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
      console.log("the receopt ", receipt);
      throw new Error("on chain failure");
    }

    let evidence: SocketEvidenceDetails;
    recipients.add(actor);
    if (type === "create") {
      const eventLogs = parseEventLogs({
        abi: event_EvidenceCreated,
        logs: receipt.logs,
        eventName: "EvidenceCreated",
      });
      if (eventLogs.length === 0) throw new Error("missing create event");
      const args = eventLogs[0].args;
      const creator = args.creator.toLowerCase() as Address;
      if (creator !== actor) throw new Error("invalid creator");
      await insertNewEvidence(
        args.metadataHash,
        args.contractAddress,
        args.evidenceId,
        creator,
        args.timeOfCreation,
        blockNumberFromReceipt,
        txHash,
        args.desc,
      );
      evidence = {
        id: args.evidenceId,
        status: "active",
        description: args.desc,
        creator: creator,
        createdAt: args.timeOfCreation.toString(),
        currentOwner: creator,
      };
      updatedAt = args.timeOfCreation;
    } else if (type === "transfer") {
      const eventLogs = parseEventLogs({
        abi: event_OwnershipTransferred,
        logs: receipt.logs,
        eventName: "OwnershipTransferred",
      });
      if (eventLogs.length === 0) throw new Error("missing transfer event");
      const args = eventLogs[0].args;
      const newOwner = args.newOwner.toLowerCase() as Address;
      const result = await updateTransferOwnership(
        args.evidenceId,
        newOwner,
        txHash,
        blockNumberFromReceipt,
        args.timeOfTransfer,
      );
      evidence = {
        id: args.evidenceId,
        status: "active",
        description: result.desc,
        creator: result.creator,
        createdAt: result.createdAt.toString(),
        currentOwner: newOwner,
      };
      updatedAt = args.timeOfTransfer;
      recipients.add(newOwner);
    } else if (type === "discontinue") {
      const eventLogs = parseEventLogs({
        abi: event_EvidenceDiscontinued,
        logs: receipt.logs,
        eventName: "EvidenceDiscontinued",
      });
      if (eventLogs.length === 0) throw new Error("missing discontinue event");
      const args = eventLogs[0].args;
      const currentOwner = args.currentOwner.toLowerCase() as Address;
      const result = await updateEvidenceDiscontinued(
        args.evidenceId,
        txHash,
        blockNumberFromReceipt,
        args.timeOfDiscontinuation,
      );
      evidence = {
        id: args.evidenceId,
        status: "discontinued",
        description: result.desc,
        creator: result.creator,
        createdAt: result.createdAt.toString(),
        currentOwner: currentOwner,
      };
      updatedAt = args.timeOfDiscontinuation;
      recipients.add(currentOwner);
    } else {
      throw new Error(`invalid activity: ${type}`);
    }
    await updateActivityForClient(
      activityId,
      "client_only",
      txHash,
      receipt.blockNumber,
      bigIntToTimeStamp(updatedAt),
    );
    // emit the event to recipients
    io.to(Array.from(recipients)).emit("activity_update", {
      activityId: activityId.toString(),
      actor: actor,
      type: type,
      status: "client_only",
      txHash: txHash.toLowerCase(),
      updatedAt: updatedAt.toString(),
      evidence,
    });
  } catch (err) {
    updatedAt = await updateActivityForClient(
      activityId,
      "failed",
      txHash,
      blockNumber,
      undefined,
      String(err),
    );
    io.to(actor).emit("activity_update", {
      activityId: activityId.toString(),
      actor: actor,
      type: type,
      status: "failed",
      txHash: txHash ? txHash.toLowerCase() : null,
      updatedAt: updatedAt,
      evidenceId: evidenceId, // in case txHash is missing
      error: err,
    });
    console.warn(`Emitted Socket Event: "activity_update failed"`, {
      actor: actor,
      evidence: evidenceId,
      error: err,
    });
  }
}

// only returns update_at if activity failed
async function updateActivityForClient(
  activityId: bigint,
  status: clientStatus,
  txHash: Bytes32 | null,
  blockNumber: bigint | null,
  preferUpdatedAt?: Date,
  error?: string,
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
          preferUpdatedAt || null,
        ],
      );
    }
  } catch (err) {
    console.error("updateActivityForClient: db error", err);
    throw new Error("db error");
  }
}
