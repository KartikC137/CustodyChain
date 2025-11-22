// src/dbHandlers/create.ts
import type { NormalizedEvent } from "../blockListeners/ledgerListener";
import { logger } from "../logger";
import { withTransaction } from "../db";

type EvidenceCreatedArgs = {
  contractAddress: `0x${string}`;
  creator: `0x${string}`;
  evidenceId: `0x${string}`;
  metadataHash: `0x${string}`;
  nonce: bigint | string | number;
};

export async function handleEvidenceCreated(
  ev: NormalizedEvent
): Promise<void> {
  if (ev.eventName !== "EvidenceCreated") {
    logger.warn(
      "handleEvidenceCreated: called with non-EvidenceCreated event",
      {
        eventName: ev.eventName,
      }
    );
    return;
  }

  const args = ev.args as unknown as EvidenceCreatedArgs;

  const contractAddress = args.contractAddress;
  const creator = args.creator;
  const evidenceId = args.evidenceId;
  const metadataHash = args.metadataHash;
  const nonce = args.nonce;

  if (!contractAddress || !creator || !evidenceId) {
    logger.error("handleEvidenceCreated: missing required args", {
      args: ev.args,
    });
    return;
  }

  const blockNumber = ev.blockNumber;
  const txHash = ev.txHash;

  await withTransaction(async (client) => {
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
            nonce = EXCLUDED.nonce
  `,
      [creator, nonce]
    );

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
  });

  logger.info("handleEvidenceCreated: evidence upserted", {
    evidenceId,
    contractAddress,
    creator,
    block: blockNumber.toString(),
    tx: txHash,
  });
}
