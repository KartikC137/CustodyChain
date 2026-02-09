import { Address, Bytes32 } from "../lib/types/solidity.types.js";
import { query } from "../config/db.js";
import { CustodyRecord } from "../lib/types/evidence.types.js";
import { parseChainOfCustody } from "./evidenceHelpers.js";

/**
 * @param timeOfCreation is bigint to keep custody record consistency and precision.
 */
export async function insertNewEvidence(
  metadataHash: Bytes32,
  contractAddress: Address,
  evidenceId: Bytes32,
  actor: Address, //already lowercased
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
      id,
      creator,
      current_owner,
      created_at,
      transferred_at,
      creation_tx_hash,
      latest_tx_hash,
      deployed_block,
      last_tx_block,
      description,
      chain_of_custody
    )
    VALUES ('active', $1, $2, $3, $4, $4, $5, $5, $6, $6, $7, $7, $8, ARRAY[ ($4, $5)::custody_record_t ])
    ON CONFLICT (id) DO NOTHING
    `,
      [
        metadataHash.toLowerCase(),
        contractAddress.toLowerCase(),
        evidenceId.toLowerCase(),
        actor,
        timeOfCreation,
        creationTxHash.toLowerCase(),
        block,
        desc,
      ],
    );
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
): Promise<{
  createdAt: bigint;
  creator: Address;
  desc: string;
}> {
  try {
    const result = await query(
      `
    UPDATE evidence
    SET current_owner = $1,
        latest_tx_hash = $2,
        last_tx_block = $3,
        transferred_at = $4,
        chain_of_custody = array_append(chain_of_custody, ($1, $4)::custody_record_t)
    WHERE id = $5
    RETURNING created_at AS "createdAt", creator, description AS "desc"
    `,
      [
        currentOwner, // already lowercased in parent
        latestTxHash.toLowerCase(),
        lastTxBlock,
        timeOfTransfer,
        evidenceId.toLowerCase(),
      ],
    );

    return result.rows[0];
  } catch (err) {
    throw new Error("update evidence failed: db error");
  }
}

export async function updateEvidenceDiscontinued(
  evidenceId: Bytes32,
  latestTxHash: Bytes32,
  lastTxBlock: bigint,
  timeOfDiscontinuation: bigint,
): Promise<{
  createdAt: bigint;
  transferredAt: bigint;
  creator: Address;
  desc: string;
}> {
  try {
    const result = await query(
      `
    UPDATE evidence 
    SET status = 'discontinued',
        latest_tx_hash = $1,
        last_tx_block = $2,
        discontinued_at = $3
    WHERE id = $4
    RETURNING created_at AS "createdAt", transferred_at AS "transferredAt", creator, description AS "desc"
    `,
      [
        latestTxHash.toLowerCase(),
        lastTxBlock,
        timeOfDiscontinuation,
        evidenceId.toLowerCase(),
      ],
    );

    return result.rows[0];
  } catch (err) {
    console.error(err);
    throw new Error("update evidence failed: db error");
  }
}
