import { withTransaction } from "../db";
import { logger } from "../../logger.js";
import {
  type TransferEvent,
  type EvidenceTransferredArgs,
} from "../evidenceListener.js";
import { TransferActivityInput } from "../../../../custodychain-web/lib/types/activity.types.js";
import {
  upsertAccount,
  insertNewActivity,
  handleSingleValidActivity,
  changeStatusFailedExcept,
} from "../../db/acitivtyHelpers.js";
import { type Address } from "viem";

const genericError = "DB: Couldn't transfer evidence";

export async function handleOwnershipTransferred(ev: TransferEvent) {
  if (ev.eventName !== "OwnershipTransferred") {
    logger.warn("handleEvidenceTransfer called with wrong event", {
      eventName: ev.eventName,
    });
    throw new Error(genericError);
  }

  const args = ev.args as EvidenceTransferredArgs;
  const evidenceId = args.evidenceId.toLowerCase() as `0x${string}`;
  const previousOwner = args.previousOwner.toLowerCase() as Address;
  const newOwner = args.newOwner.toLowerCase() as Address;
  const timeOfTransfer = args.timeOfTransfer;

  const contractAddress = ev.address.toLowerCase() as Address;
  const txHash = ev.txHash.toLowerCase() as `0x${string}`;
  const blockNumber = ev.blockNumber ?? 0n;

  if (
    !previousOwner ||
    !newOwner ||
    !timeOfTransfer ||
    !txHash ||
    !evidenceId
  ) {
    logger.error("handleEvidenceTransfer: missing args", { args });
    throw new Error(genericError);
  }

  if (previousOwner === newOwner) {
    logger.warn("handleEvidenceTransfer: redundant transfer (self-transfer)", {
      evidenceId,
    });
    throw new Error(genericError);
  }

  const transferActivityInfo: TransferActivityInput = {
    contractAddress,
    evidenceId,
    actor: previousOwner,
    type: "transfer",
    from: previousOwner,
    to: newOwner,
    txHash,
    blockNumber,
    meta: {
      timeOfTransfer: timeOfTransfer.toString(),
    },
  };

  const validActivityCheck = (toCheck: any) =>
    toCheck.to_addr.toLowerCase() !== toCheck.from_addr.toLowerCase() &&
    toCheck.txHash.toLowerCase() === txHash &&
    toCheck.actor.toLowerCase() === previousOwner &&
    toCheck.contract_address === contractAddress &&
    toCheck.from_addr.toLowerCase() === previousOwner &&
    toCheck.to_addr.toLowerCase() === newOwner;

  logger.info("transfer: handling transfer event", {
    evidenceId,
    from: previousOwner,
    to: newOwner,
    block: blockNumber.toString(),
  });

  await withTransaction(async (client) => {
    const dbEvidence = await client.query(
      `SELECT current_owner FROM evidence WHERE evidence_id = $1`,
      [evidenceId],
    );

    if (dbEvidence.rowCount === 0) {
      logger.error(
        "handleEvidenceTransfer: evidence not found in DB. Wait for listener to fetch it...",
        {
          evidenceId,
        },
      );
      throw new Error(genericError);
    }

    const dbCurrentOwner = dbEvidence.rows[0].current_owner?.toLowerCase();

    if (dbCurrentOwner && dbCurrentOwner !== previousOwner) {
      logger.error(
        "handleEvidenceTransfer: unauthorized transfer flow detected. DB current_owner does not match event previousOwner.",
        {
          dbOwner: dbCurrentOwner,
          eventPreviousOwner: previousOwner,
          evidenceId,
        },
      );
      throw new Error(genericError);
    }

    // Accounts Table
    // insert both users if dont exist already.
    await upsertAccount(previousOwner, client);
    await upsertAccount(newOwner, client);

    // Evidence Table
    // update the evidence preferring listener values
    await client.query(
      `
      UPDATE evidence
      SET current_owner = $1,
          updated_at = now(),
          latest_tx_hash = $2,
          last_tx_block = $3
      WHERE evidence_id = $4
      `,
      [newOwner, txHash, blockNumber.toString(), evidenceId],
    );

    logger.info("handleEvidenceTransfer: evidence ownership updated in DB", {
      evidenceId: evidenceId,
      previousOwner: previousOwner,
      currentOwner: newOwner,
    });
  });

  // Activity Table Resolution
  await withTransaction(async (client) => {
    // fetch all of transfer activity related to this evidence_id, and then order by latest first according to id.
    const existing = await client.query(
      `
        SELECT *
        FROM activity
        WHERE evidence_id = $1
          AND type = 'transfer'
          AND status IN ('client_only', 'failed')
          AND from_addr = $2 
          AND to_addr = $3
        ORDER BY id DESC
      `,
      [evidenceId, previousOwner, newOwner],
    );

    const rows = existing.rows;

    if (rows.length === 0) {
      // this activity was performed from somewhere else.
      logger.info(
        "handleEvidenceTransfer: missing client activity for this specific transfer. inserting as db_only...",
        { from: previousOwner, to: newOwner },
      );
      await insertNewActivity(client, "db_only", transferActivityInfo);
      return;
    }

    // check validity of transfer activity
    const validActivities = rows.filter((r) => validActivityCheck(r));

    if (validActivities.length >= 1) {
      // out of all valid ones, select latest one by id.
      const activity = validActivities[0];
      const activityId = BigInt(activity.id);

      logger.info("handleEvidenceTransfer: found valid matching activity", {
        id: activityId.toString(),
      });

      // if client_only -> on_chain, if failed -> assume it was created from somewhere else.
      await handleSingleValidActivity(client, activity);

      if (validActivities.length > 1) {
        // if more than one valid activities were found, mark the rest as failed
        await changeStatusFailedExcept(
          evidenceId,
          client,
          activityId,
          "transfer",
        );
      }
      return;
    }

    // no valid activity was found, mark all of them as failed and insert a new one.
    logger.warn(
      "handleEvidenceTransfer: activities found for this sender/receiver, but TxHash mismatch. Failing them and inserting new.",
    );
    await changeStatusFailedExcept(evidenceId, client, -1n, "transfer");
    await insertNewActivity(client, "on_chain", transferActivityInfo);
  });

  logger.info("handleEvidenceTransfer: complete", { evidenceId });
}
