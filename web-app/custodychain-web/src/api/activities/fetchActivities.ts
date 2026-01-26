"use server";

import { query } from "@/src/config/db";
import { Address } from "viem";
import {
  type ActivityRow,
  type ActivityInfoForPanel,
} from "@/src/lib/types/activity.types";

/**
 * @todo remove to_addr and prefer owner only
 * @dev it fetches all the activities where the account is either the actor or to_addr, meaning when actor is the reciever of evidence.
 * @returns ActivityInfoForPanel[] this type ensures the info is only that required by panel
 */
export async function fetchActivitiesForPanel(
  account: Address,
  count: number,
): Promise<ActivityInfoForPanel[]> {
  const sql = `
    SELECT id, type, status, tx_hash, to_addr, updated_at, actor, evidence_id, owner
    FROM activity 
    WHERE actor = $1 OR to_addr = $1 OR owner = $1
    ORDER BY updated_at DESC 
    LIMIT $2
  `;
  const result = await query(sql, [account.toLowerCase(), count]);
  return result.rows as ActivityInfoForPanel[];
}

export async function fetchActivitiesByAccount(
  account: Address,
  count: number,
): Promise<ActivityRow[]> {
  const sql = `
    SELECT *
    FROM activity 
    WHERE actor = $1
    ORDER BY updated_at DESC 
    LIMIT $2
  `;
  const result = await query(sql, [account.toLowerCase(), count]);
  return result.rows as ActivityRow[];
}
