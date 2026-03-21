"use server";

import { query } from "@/src/config/db";
import { EvidenceDetails } from "@/src/lib/types/evidence.types";
import { Address, Bytes32 } from "@/src/lib/types/solidity.types";
import { parseChainOfCustody } from "@/src/lib/util/helpers";
import { ContextEvidenceDetails } from "@/src/lib/types/evidence.types";

/**
 * @returns Formatted data from db of type EvidenceDetails
 */
export async function fetchSingleEvidence(
  id: Bytes32,
): Promise<EvidenceDetails> {
  const result = await query(
    `
    SELECT id, status, description, creator, current_owner AS "currentOwner", created_at AS "createdAt", transferred_at AS "transferredAt", contract_address AS "contractAddress", chain_of_custody, discontinued_at AS "discontinuedAt"
    FROM evidence
    WHERE id = $1
    `,
    [id],
  );
  return {
    ...result.rows[0],
    chainOfCustody: parseChainOfCustody(result.rows[0].chain_of_custody),
  };
}

/**
 *
 * @dev postgres returns bigint as string values
 *
 */
export async function fetchEvidencesByAccount(
  account: Address,
): Promise<ContextEvidenceDetails[]> {
  const result = await query(
    `
     SELECT id, status, description, creator, current_owner AS "currentOwner", created_at AS "createdAt", transferred_at AS "transferredAt", discontinued_at AS "discontinuedAt", chain_of_custody AS "chainOfCustody"
     FROM evidence
     WHERE EXISTS (
      SELECT 1 
      FROM unnest(chain_of_custody) AS record 
      WHERE record.owner = $1
    )
     ORDER BY created_at DESC
    `,
    [account.toLowerCase()],
  );
  return result.rows;
}
