import { withTransaction } from "../db";
import { logger } from "../../logger.js";
import { config } from "../config";
import { publicClient } from "../web3config";
import {
  type DiscontinueEvent,
  type EvidenceDiscontinuedArgs,
} from "../evidenceListener.js";
import { DiscontinueActivityInput } from "../../../../custodychain-web/lib/types/activity.types.js";
//todo fix this later
import {
  upsertAccount,
  insertNewActivity,
  handleSingleValidActivity,
  changeStatus,
  changeStatusFailedExcept,
} from "../../db/acitivtyHelpers.js";
import { type Address } from "viem";
import { evidenceAbi } from "../../../lib/contractAbi/chain-of-custody-abi";
import { evidenceLedgerAbi } from "../../../lib/contractAbi/evidence-ledger-abi";

const genericError = "DB: Couldn't discontinue evidence";
// TODO merge with handleCreate in future if possible

export async function handleEvidenceDiscontinued(ev: DiscontinueEvent) {
  if (ev.eventName !== "EvidenceDiscontinued") {
    logger.warn("handleEvidenceDiscontinued called with wrong event", {
      eventName: ev.eventName,
    });
    throw new Error(genericError);
  }

  const args = ev.args as EvidenceDiscontinuedArgs;
  const evidenceId = args.evidenceId.toLowerCase() as `0x${string}`;
  const caller = args.caller.toLowerCase() as `0x${string}`;
  const timeOfDiscontinuation = args.timeOfDiscontinuation;

  const txHash = ev.txHash.toLowerCase() as `0x${string}`;
  const contractAddress = ev.address.toLowerCase() as `0x${string}`;

  if (!contractAddress) {
    logger.error("discontinue: missing contract Address");
    throw new Error(genericError);
  }

  const activeOnChain = (await publicClient.readContract({
    address: contractAddress,
    abi: evidenceAbi,
    functionName: "getEvidenceState",
  })) as boolean;

  if (!activeOnChain) {
    logger.warn("discontinue: this evidence is active on chain!");
    throw new Error(genericError);
  }

  const creator = (await publicClient.readContract({
    address: contractAddress,
    abi: evidenceAbi,
    functionName: "getEvidenceCreator",
  })) as Address;

  if (!creator) {
    logger.error(
      "discontinue: creator was not returned, check contract address.",
    );
    throw new Error(genericError);
  }

  if (!evidenceId || !caller || !timeOfDiscontinuation || !txHash) {
    logger.error("handleEvidenceDiscontinued: missing args", {
      args: ev.args,
    });
    throw new Error(genericError);
  }
  const blockNumber = ev.blockNumber ?? 0;

  if (caller !== creator) {
    logger.error("discontinue: caller is not the creator of this evidence", {
      caller: caller,
      creator: creator,
    });
    throw new Error(genericError);
  }

  const nonce = (await publicClient.readContract({
    address: config.LEDGER_CONTRACT_ADDRESS,
    abi: evidenceLedgerAbi,
    functionName: "getCreatorNonce",
    args: [creator],
  })) as bigint;

  if (!nonce || nonce === 0n) {
    logger.error("discontinue: invalid creator nonce. expected >0", nonce);
    throw new Error(genericError);
  }

  const discontinueActivityInfo: DiscontinueActivityInput = {
    contractAddress: contractAddress,
    evidenceId: evidenceId,
    actor: creator,
    type: "discontinue",
    txHash: txHash,
    blockNumber: blockNumber,
    meta: { timeOfDiscontinuation: timeOfDiscontinuation.toString() },
  };

  const validActivityCheck = (toCheck: any) =>
    toCheck.txHash.toLowerCase() === txHash &&
    toCheck.actor.toLowerCase() === creator &&
    toCheck.contract_address === contractAddress;

  logger.info("discontinue: handling discontinue event", {
    evidenceId: evidenceId,
    txHash: txHash,
    blockNumber: blockNumber,
  });

  await withTransaction(async (client) => {
    // Account Table
    await upsertAccount(creator, client, nonce);

    // Evidence Table (upsert) // prefer on chain value of creator
    await client.query(
      `
        UPDATE evidence
        SET status = 'discontinued',
            creator = $1,
            updated_at = now(),
            latest_tx_hash = $2,
            last_tx_block = $3
        WHERE evidence_id = $4
        `,
      [creator, txHash, blockNumber.toString(), evidenceId],
    );

    logger.info(
      "handleEvidenceDiscontinued: accounts and evidence table updated successfully!, waiting for activity validation...",
      {
        type: "discontinue",
        evidenceId,
        contractAddress,
        creator,
        block: blockNumber.toString(),
        tx: txHash,
      },
    );
  });

  // Activity Table
  await withTransaction(async (client) => {
    const existing = await client.query(
      `
        SELECT *
        FROM activity
        WHERE evidence_id = $1
          AND type = 'discontinue'
          AND status IN ('client_only', 'failed')
        ORDER BY id DESC
        `,
      [evidenceId],
    );

    const rows = existing.rows;

    if (rows.length === 0) {
      logger.info(
        "handleEvidenceDiscontinued: missing client activity for this evidence. inserting activity as db_only...",
        {
          evidenceId,
        },
      );
      await insertNewActivity(client, "db_only", discontinueActivityInfo);
      return;
    }

    if (rows.length === 1) {
      const activity = rows[0];
      if (validActivityCheck(activity)) {
        await handleSingleValidActivity(client, activity);
        return;
      } else {
        logger.warn(
          "handleEvidenceDiscontinued: invalid evidence found marking it failed and inserting valid one as on_chain...",
          { evidenceId: evidenceId },
        );
        await changeStatus(client, BigInt(activity.id), "failed");
        await insertNewActivity(client, "on_chain", discontinueActivityInfo);
        return;
      }
    }

    // Multiple activities found.

    const validActivities = rows.filter((r) => validActivityCheck(r));

    logger.warn(
      "handleEvidenceDiscontinued: multiple activities with same evidenceId found, preferring listener values...",
      { allActivities: rows, validActivities: validActivities },
    );

    if (validActivities.length === 1) {
      const validId = BigInt(validActivities[0].id);
      logger.info(
        "handleEvidenceDiscontinued: found one valid activity among duplicates, fixing...",
        { id: validId.toString() },
      );

      await changeStatus(client, validId, "on_chain");
      await changeStatusFailedExcept(
        evidenceId,
        client,
        validId,
        "discontinue",
      );
      return;
    }

    // Only one discontinue + client_only is supposed to exist, if multiple exists, mark them all as failed (keep the duplicates for debugging).
    // Multiple discontinue + failed can exist, keep them failed.

    const latest = rows[0];
    const latestId = BigInt(latest.id);

    if (latest.status === "failed") {
      // Client tried, failed, and gave up. But event happened?
      // Mark ALL existing as failed (including latest) and create a fresh db_only record.
      logger.info(
        "handleEvidenceDiscontinued: latest activity is failed. Marking all failed, inserting fresh db_only.",
      );
      await changeStatusFailedExcept(evidenceId, client, -1n, "discontinue"); // -1n to match All Rows.
      await insertNewActivity(client, "db_only", discontinueActivityInfo);
      return;
    }

    if (latest.status === "client_only") {
      // created by client, waiting for on chain validation, but duplicates were inserted. If it matches validity check, we take it.
      // If it fails validity check (wrong actor/txHash), we fail it and insert new.
      if (validActivityCheck(latest)) {
        logger.info(
          "handleEvidenceDiscontinued: latest activity is valid. Promoting to on_chain and failing others.",
        );
        await changeStatus(client, latestId, "on_chain");
        await changeStatusFailedExcept(
          evidenceId,
          client,
          latestId,
          "discontinue",
        );
      } else {
        logger.warn(
          "handleEvidenceDiscontinued: latest activity is client_only but INVALID (hash mismatch). Failing all, inserting fresh on_chain.",
        );
        await changeStatusFailedExcept(evidenceId, client, -1n, "discontinue"); // Fail all
        await insertNewActivity(client, "on_chain", discontinueActivityInfo);
      }
      return;
    }
    logger.info(
      "handleEvidenceDiscontinued: Activity validated successfully!",
      {
        activityId: rows[0].id,
        evidenceId: evidenceId,
      },
    );
  });
  logger.info("handleEvidenceDiscontinued: evidence marked discontinued", {
    evidenceId,
  });
}
