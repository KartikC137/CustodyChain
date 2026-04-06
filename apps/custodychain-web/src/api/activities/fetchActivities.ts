"use server";

import { query } from "@/src/configs/dbConfig";
import { Address } from "viem";

/**
 * @todo maybe change table column names to camelcase to match ts
 * @dev it fetches all the activities where the account is either the actor or to_addr, meaning when actor is the reciever of evidence.
 */
export async function fetchActivities(
  account: Address,
  chainId: number,
): Promise<any[]> {
  const sql = `
    SELECT id, type, status, tx_hash as "txHash", updated_at as "updatedAt", actor, evidence_id as "evidenceId", owner
    FROM activity 
    WHERE chain_id = $1 AND (actor = $2 OR owner = $2)
    ORDER BY updated_at DESC 
  `;
  const result = await query(sql, [chainId, account.toLowerCase()]);
  return result.rows;
}
