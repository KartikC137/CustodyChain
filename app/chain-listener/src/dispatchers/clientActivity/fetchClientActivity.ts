"use server";

import { query } from "../../db";
import { Address } from "viem"; // todo confirm type
import { ActivityRow } from "../../types/activity.types";

export async function fetchActivitiesByAccount(
  account: Address,
  count: number
): Promise<ActivityRow[]> {
  const sql = `
    SELECT 
      evidence_id, 
      type, 
      from_addr, 
      to_addr, 
      updated_at,
      status
    FROM activity 
    WHERE actor = $1
    ORDER BY updated_at DESC 
    LIMIT $2
  `;
  const result = await query(sql, [account.toLowerCase(), count]);
  return result.rows as ActivityRow[];
}
