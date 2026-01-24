import { Address, Bytes32 } from "../lib/types/solidity.types.js";
import { query } from "../config/db.js";

const bigIntToTimeStamp = (rawTimeStamp: bigint) => {
  return new Date(Number(rawTimeStamp) * 1000);
};

/**
 * @param timeOfCreation is bigint to keep custody record consistency and precision.
 */
export async function insertNewEvidence(
  metadataHash: Bytes32,
  contractAddress: Address,
  evidenceId: Bytes32,
  actor: Address,
  timeOfCreation: bigint,
  block: bigint,
  creationTxHash: Bytes32,
  desc: string,
) {
  try {
    await query(
      `
    INSERT INTO evidence (
      status,
      metadata_hash,
      contract_address,
      evidence_id,
      creator,
      created_at,
      current_owner,
      updated_at,
      latest_tx_hash,
      last_tx_block,
      deployed_block,
      creation_tx_hash,
      description,
      chain_of_custody
    )
    VALUES ('active', $1, $2, $3, $4, $5, $6, now(), $7, $8, $9, $10, $11, ARRAY[ ($4, $12)::custody_record_t ])
    ON CONFLICT (evidence_id) DO NOTHING
    `,
      [
        metadataHash.toLowerCase(),
        contractAddress.toLowerCase(),
        evidenceId.toLowerCase(),
        actor.toLowerCase(),
        bigIntToTimeStamp(timeOfCreation),
        actor.toLowerCase(),
        creationTxHash.toLowerCase(),
        block,
        block,
        creationTxHash.toLowerCase(),
        desc,
        timeOfCreation,
      ],
    );
    return;
  } catch (err) {
    throw new Error("insert evidence failed: db error");
  }
}
/**
 * @param timeOfTransfer is bigint to keep custody record consistency and precision.
 */
export async function updateTransferOwnership(
  evidenceId: Bytes32,
  currentOwner: Address,
  latestTxHash: Bytes32,
  lastTxBlock: bigint,
  timeOfTransfer: bigint,
) {
  try {
    await query(
      `
    UPDATE evidence
    SET current_owner = $1,
        latest_tx_hash = $2,
        last_tx_block = $3,
        updated_at = now(),
        chain_of_custody = array_append(chain_of_custody, ($1, $4)::custody_record_t)
    WHERE evidence_id = $5
    `,
      [
        currentOwner.toLowerCase(),
        latestTxHash.toLowerCase(),
        lastTxBlock,
        timeOfTransfer,
        evidenceId.toLowerCase(),
      ],
    );

    return;
  } catch (err) {
    throw new Error("update evidence failed: db error");
  }
}

export async function updateEvidenceDiscontinued(
  evidenceId: Bytes32,
  latestTxHash: Bytes32,
  lastTxBlock: bigint,
  timeOfDiscontinuation: bigint,
) {
  try {
    await query(
      `
    UPDATE evidence 
    SET status = 'discontinued',
        latest_tx_hash = $1,
        last_tx_block = $2,
        discontinued_at = $3,
        updated_at = now()
    WHERE evidence_id = $4
    `,
      [
        latestTxHash.toLowerCase(),
        lastTxBlock,
        bigIntToTimeStamp(timeOfDiscontinuation),
        evidenceId.toLowerCase(),
      ],
    );

    return;
  } catch (err) {
    throw new Error("update evidence failed: db error");
  }
}
