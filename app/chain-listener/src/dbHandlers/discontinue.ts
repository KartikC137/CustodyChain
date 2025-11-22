// src/dbHandlers/discontinue.ts
import { withTransaction } from "../db";
import { logger } from "../logger";
import { type NormalizedEvent } from "../blockListeners/ledgerListener";

interface DiscontinueArgs {
  evidenceId: `0x${string}`;
}

export async function handleEvidenceDiscontinued(ev: NormalizedEvent) {
  if (ev.eventName !== "EvidenceDiscontinued") {
    logger.warn("handleEvidenceDiscontinued called with wrong event", {
      eventName: ev.eventName,
    });
    return;
  }

  const { evidenceId } = ev.args as DiscontinueArgs;

  if (!evidenceId) {
    logger.error("handleEvidenceDiscontinued: missing evidenceId", {
      args: ev.args,
    });
    return;
  }

  const txHash = ev.txHash;
  const blockNumber = ev.blockNumber;

  logger.info("discontinue: handling discontinue event", {
    evidenceId,
    txHash,
    blockNumber: blockNumber.toString(),
  });

  await withTransaction(async (client) => {
    const res = await client.query(
      `
      UPDATE evidence
      SET status = 'discontinued',
          updated_at = now(),
          latest_tx_hash = $2,
          last_tx_block = $3
      WHERE evidence_id = $1
      `,
      [evidenceId, txHash, blockNumber.toString()]
    );

    if (res.rowCount === 0) {
      logger.error(
        "handleEvidenceDiscontinued: no such evidence exists with ID: ",
        {
          evidenceId,
        }
      );
    }
  });

  logger.info("handleEvidenceDiscontinued: evidence marked discontinued", {
    evidenceId,
  });
}
