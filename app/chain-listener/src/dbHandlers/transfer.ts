// src/dbHandlers/transfer.ts
import type { NormalizedEvent } from "../blockListeners/ledgerListener";
import { logger } from "../logger";
import { withTransaction } from "../db";

type OwnershipTransferredArgs = {
  previousOwner: `0x${string}`;
  newOwner: `0x${string}`;
  timeOfTransfer: bigint | number | string;
};

export async function handleOwnershipTransferred(
  ev: NormalizedEvent
): Promise<void> {
  if (ev.eventName !== "OwnershipTransferred") {
    logger.warn("handleOwnershipTransferred called with wrong event", {
      eventName: ev.eventName,
    });
    return;
  }

  const args = ev.args as unknown as OwnershipTransferredArgs;

  const previousOwner = args.previousOwner;
  const newOwner = args.newOwner;

  if (!newOwner || !previousOwner) {
    logger.error("handleOwnershipTransferred: missing owners", {
      args: ev.args,
    });
    return;
  }

  const txHash = ev.txHash;
  const blockNumber = ev.blockNumber;
  const evidenceContract = ev.address;

  await withTransaction(async (client) => {
    await client.query(
      `
      INSERT INTO accounts (address, account_type)
      VALUES ($1, 'manager')
      ON CONFLICT (address) DO UPDATE
        SET updated_at = now(),
            account_type = CASE
                WHEN accounts.account_type = 'viewer' THEN 'manager'
                ELSE accounts.account_type
            END,
      `,
      [previousOwner]
    );

    await client.query(
      `
      INSERT INTO accounts (address, account_type)
      VALUES ($1, 'manager')
      ON CONFLICT (address) DO UPDATE
        SET updated_at = now(),
            account_type = CASE
                WHEN accounts.account_type = 'viewer' THEN 'manager'
                ELSE accounts.account_type
            END,
      `,
      [newOwner]
    );

    const res = await client.query(
      `
      UPDATE evidence
      SET current_owner   = $1,
          last_tx_block   = $2,
          latest_tx_hash  = $3,
          updated_at      = now()
      WHERE contract_address = $4
      `,
      [newOwner, blockNumber.toString(), txHash, evidenceContract]
    );

    if (res.rowCount === 0) {
      logger.error(
        "handleOwnershipTransferred: no such evidence exists with contract Address: ",
        {
          evidenceContract,
        }
      );
    }
  });

  logger.info("handleOwnershipTransferred: updated evidence", {
    evidenceContract,
    previousOwner,
    newOwner,
    block: blockNumber.toString(),
    tx: txHash,
  });
}
