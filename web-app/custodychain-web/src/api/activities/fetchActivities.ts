"use server";

import { query } from "@/src/config/db";
import { Address } from "viem";
import { type ActivityInfoForPanel } from "@/src/lib/types/activity.types";

/**
 * @todo maybe change table column names to camelcase to match ts
 * @dev it fetches all the activities where the account is either the actor or to_addr, meaning when actor is the reciever of evidence.
 */
export async function fetchActivities(account: Address): Promise<any[]> {
  const sql = `
    SELECT id, type, status, tx_hash as "txHash", updated_at as "updatedAt", actor, evidence_id as "evidenceId", owner
    FROM activity 
    WHERE (actor = $1 OR owner = $1)
    ORDER BY updated_at DESC 
  `;
  const result = await query(sql, [account.toLowerCase()]);
  return result.rows;
}
