"use server";

import { query } from "../../../config/db";
import { Address } from "viem";
import {
  type ActivityRow,
  type ActivityInfoForPanel,
} from "../../../lib/types/activity.types";

// basic info
export async function fetchActivitiesForPanel(
  account: Address,
  count: number
): Promise<ActivityInfoForPanel[]> {
  const sql = `
    SELECT id,type,status,tx_hash,from_addr,to_addr,updated_at,actor,evidence_id
    FROM activity 
    WHERE actor = $1
    ORDER BY updated_at DESC 
    LIMIT $2
  `;
  const result = await query(sql, [account.toLowerCase(), count]);
  return result.rows as ActivityInfoForPanel[];
}

export async function fetchActivitiesByAccount(
  account: Address,
  count: number
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
