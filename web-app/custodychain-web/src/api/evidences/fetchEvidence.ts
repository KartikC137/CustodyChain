"use server";

import { query } from "@/src/config/db";
import { EvidenceDetails } from "@/src/lib/types/evidence.types";
import { Address, Bytes32 } from "@/src/lib/types/solidity.types";
import { parseChainOfCustody } from "@/src/lib/util/helpers";
import { SocketEvidenceDetails } from "@/src/lib/types/socketEvent.types";

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
): Promise<SocketEvidenceDetails[]> {
  const result = await query(
    `
     SELECT id, status, description, creator, current_owner AS "currentOwner", created_at AS "createdAt", transferred_at AS "transferredAt", discontinued_at AS "discontinuedAt"
     FROM evidence
     WHERE creator = $1 OR current_owner = $1
     ORDER BY created_at DESC
    `,
    [account.toLowerCase()],
  );
  return result.rows;
}
