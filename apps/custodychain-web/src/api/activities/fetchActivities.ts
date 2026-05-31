"use server";

import { query } from "@/src/configs/dbConfig";
import { Address } from "viem";

/**
 * @dev it fetches all the activities where the account is either the actor or to_addr, meaning when actor is the reciever of evidence.
 */
export async function fetchActivities(
  account: Address,
  chainId: number,
  ledgerAddress: Address,
): Promise<any[]> {
  const sql = `
    SELECT 
      a.id, 
      a.type, 
      a.status, 
      a.tx_hash AS "txHash", 
      a.updated_at AS "updatedAt", 
      a.actor, 
      a.evidence_id AS "evidenceId", 
      a.owner
    FROM activity a
    INNER JOIN ledger_info l ON a.ledger_id = l.id
    WHERE (a.actor = $1 OR a.owner = $1)
      AND l.chain_id = $2 
      AND l.address = $3
    ORDER BY a.updated_at DESC;
  `;
  const result = await query(sql, [
    account.toLowerCase(),
    chainId,
    ledgerAddress.toLowerCase(),
  ]);
  return result.rows;
}
