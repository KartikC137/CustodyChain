import { logger } from "../logger";
import { withTransaction } from "../db";
import { PoolClient } from "pg";

import type {
  EvidenceCreatedArgs,
  CreateEvent,
} from "../blockListeners/ledgerListener";
import { CreateActivityInput } from "../types/activity.types";
import {
  insertNewActivity,
  changeStatus,
  changeStatusFailedExcept,
} from "../helpers/acitivtyHelpers";

const genericError = "DB: Couldn't create evidence";

export async function upsertAccount(
  account: string,
  client: PoolClient,
  nonce?: bigint
) {
  const nonceValue = nonce ? nonce.toString() : 0;
  await client.query(
    `
    INSERT INTO accounts (address, account_type, nonce)
    VALUES ($1, 'manager', $2)
    ON CONFLICT (address) DO UPDATE
    SET updated_at = now(),
        account_type = CASE
        WHEN accounts.account_type = 'viewer' THEN 'manager'
        ELSE accounts.account_type
        END,
        nonce = GREATEST(accounts.nonce, EXCLUDED.nonce)
    `,
    [account, nonceValue]
  );
}

// TODO: assert activity type according to the table if possible
export async function handleSingleValidActivity(
  client: PoolClient,
  activity: any
) {
  if (activity.status === "client_only") {
    await changeStatus(client, BigInt(activity.id), "on_chain");
    return;
  } else if (activity.status === "failed") {
    logger.warn(
      "ActivityHandler: this activity is assumed off-client, marking it db_only...",
      { activityId: activity.id, evidenceId: activity.evidence_id }
    );
    await changeStatus(client, BigInt(activity.id), "db_only");
    return;
  }
  return;
}

export async function handleEvidenceCreated(ev: CreateEvent): Promise<void> {
  if (ev.eventName !== "EvidenceCreated") {
    logger.error(
      "handleEvidenceCreated: called with non-EvidenceCreated event",
      {
        eventName: ev.eventName,
      }
    );
    throw new Error(genericError);
  }

  const args = ev.args as EvidenceCreatedArgs;
  const contractAddress = args.contractAddress.toLowerCase() as `0x${string}`;
  const creator = args.creator.toLowerCase() as `0x${string}`;
  const evidenceId = args.evidenceId.toLowerCase() as `0x${string}`;
  const metadataHash = args.metadataHash as `0x${string}`;
  const nonce = args.nonce;

  const txHash = ev.txHash.toLowerCase() as `0x${string}`;

  if (!contractAddress || !creator || !evidenceId || !txHash) {
    logger.error("handleEvidenceCreated: missing required args", {
      args: ev.args,
    });
    throw new Error(genericError);
  }

  const blockNumber = ev.blockNumber ?? 0;

  logger.info("create: handling create event", {
    evidenceId,
    txHash,
    blockNumber: blockNumber.toString(),
  });

  const createActivityInfo: CreateActivityInput = {
    contractAddress: contractAddress,
    evidenceId: evidenceId,
    actor: creator,
    type: "create",
    txHash: txHash,
    blockNumber: blockNumber,
    meta: { metadataHash },
  };

  const validActivityCheck = (toCheck: any) =>
    toCheck.txHash.toLowerCase() === txHash &&
    toCheck.actor.toLowerCase() === creator &&
    toCheck.contract_address === contractAddress;

  // Accounts and Evidence Update
  await withTransaction(async (client) => {
    // Accounts table
    await upsertAccount(creator, client, nonce);

    // Evidence table // TODO: emit time of creation from contract event and prefer that for created_at, currently set to now()
    await client.query(
      `
      INSERT INTO evidence (
        evidence_id,
        contract_address,
        creator,
        current_owner,
        metadata_hash,
        status,
        created_at,
        updated_at,
        latest_tx_hash,
        last_tx_block,
        deployed_block
      )
      VALUES ($1, $2, $3, $4, $5, 'active', now(), now(), $6, $7, $8)
      ON CONFLICT (evidence_id) DO UPDATE
        SET contract_address    = EXCLUDED.contract_address,
            current_owner       = EXCLUDED.current_owner,
            metadata_hash       = EXCLUDED.metadata_hash,
            status              = 'active',
            latest_tx_hash      = EXCLUDED.latest_tx_hash,
            last_tx_block       = EXCLUDED.last_tx_block,
            updated_at          = now()
      `,
      [
        evidenceId,
        contractAddress,
        creator,
        creator,
        metadataHash,
        txHash,
        blockNumber.toString(),
        blockNumber.toString(),
      ]
    );
    logger.info(
      "handleEvidenceCreated: accounts and evidence table updated successfully!, waiting for activity validation...",
      {
        type: "create",
        evidenceId,
        contractAddress,
        creator,
        block: blockNumber.toString(),
        tx: txHash,
      }
    );
  });

  // Activity Validation
  await withTransaction(async (client) => {
    // Activity table
    const existing = await client.query(
      `
        SELECT *
        FROM activity
        WHERE evidence_id = $1
          AND type = 'create'
          AND status IN ('client_only', 'failed')
        ORDER BY id DESC
      `,
      [evidenceId]
    );

    const rows = existing.rows;

    if (rows.length === 0) {
      logger.info(
        "handleEvidenceCreated: missing client activity for this evidence. inserting activity as db_only...",
        {
          evidenceId,
          contractAddress,
          creator,
        }
      );
      await insertNewActivity("db_only", createActivityInfo, client);
      return;
    }

    if (rows.length === 1) {
      const activity = rows[0];
      if (validActivityCheck(activity)) {
        await handleSingleValidActivity(client, activity);
        return;
      } else {
        logger.warn(
          "handleEvidenceCreated: invalid evidence found marking it failed and inserting valid one as on_chain...",
          { evidenceId: evidenceId }
        );
        await changeStatus(client, BigInt(activity.id), "failed");
        await insertNewActivity("on_chain", createActivityInfo, client);
        return;
      }
    }

    // Multiple activities found.

    const validActivities = rows.filter((r) => validActivityCheck(r));

    logger.warn(
      "handleEvidenceCreated: multiple activities with same evidenceId found preferring listener values...",
      { allActivities: rows, validActivities: validActivities }
    );

    if (validActivities.length === 1) {
      const validId = BigInt(validActivities[0].id);
      logger.info(
        "handleEvidenceCreated: found one valid activity among duplicates, fixing...",
        { id: validId.toString() }
      );

      await changeStatus(client, validId, "on_chain");
      await changeStatusFailedExcept(evidenceId, client, validId, "create");
      return;
    }

    // Only one create + client_only is supposed to exist, if multiple exists, mark them all as failed (keep the duplicates for debugging).
    // Multiple create + failed can exist, keep them failed.

    const latest = rows[0];
    const latestId = BigInt(latest.id);

    if (latest.status === "failed") {
      // Client tried, failed, and gave up. But event happened?
      // Mark ALL existing as failed (including latest) and create a fresh db_only record.
      logger.info(
        "handleEvidenceCreated: latest activity is failed. Marking all failed, inserting fresh db_only."
      );
      await changeStatusFailedExcept(evidenceId, client, -1n, "create"); // -1n to match All Rows.
      await insertNewActivity("db_only", createActivityInfo, client);
      return;
    }

    if (latest.status === "client_only") {
      // created by client, waiting for on chain validation, but duplicates were inserted. If it matches validity check, we take it.
      // If it fails validity check (wrong actor/txHash), we fail it and insert new.
      if (validActivityCheck(latest)) {
        logger.info(
          "handleEvidenceCreated: latest activity is valid. Promoting to on_chain and failing others."
        );
        await changeStatus(client, latestId, "on_chain");
        await changeStatusFailedExcept(evidenceId, client, latestId, "create");
      } else {
        logger.warn(
          "handleEvidenceCreated: latest activity is client_only but INVALID (hash mismatch). Failing all, inserting fresh on_chain."
        );
        await changeStatusFailedExcept(evidenceId, client, -1n, "create"); // Fail all
        await insertNewActivity("on_chain", createActivityInfo, client);
      }
      return;
    }
    logger.info("handleEvidenceCreated: Activity validated successfully!", {
      activityId: rows[0].id,
      evidenceId: evidenceId,
    });
  });
}
