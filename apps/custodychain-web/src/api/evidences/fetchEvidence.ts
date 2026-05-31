"use server";

import { query } from "@/src/configs/dbConfig";
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
  chainId: number,
  ledgerAddress: Address,
  account: Address,
): Promise<ContextEvidenceDetails[]> {
  const result = await query(
    `
    SELECT 
      e.id, 
      e.status, 
      e.description, 
      e.creator, 
      e.current_owner AS "currentOwner", 
      e.created_at AS "createdAt", 
      e.transferred_at AS "transferredAt", 
      e.discontinued_at AS "discontinuedAt", 
      e.chain_of_custody AS "chainOfCustody"
    FROM evidence e
    INNER JOIN ledger_info l ON e.ledger_id = l.id
    WHERE l.chain_id = $1 
      AND l.address = $2
      AND EXISTS (
        SELECT 1 
        FROM unnest(e.chain_of_custody) AS record 
        WHERE LOWER(record.owner) = LOWER($3)
      )
    ORDER BY e.created_at DESC;
    `,
    [chainId, ledgerAddress.toLowerCase(), account.toLowerCase()],
  );
  return result.rows;
}
