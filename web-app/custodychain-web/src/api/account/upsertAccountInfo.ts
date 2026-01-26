"use server";

import { query } from "@/src/config/db";
import { Address } from "@/src/lib/types/solidity.types";

export type accountType = "viewer" | "manager";

export async function upsertAccountInfoForNewActivity(
  address: Address,
  accountType: accountType,
) {
  try {
    await query(
      `
      INSERT INTO accounts (address, account_type)
      VALUES ($1, $2)
      ON CONFLICT (address) 
      DO UPDATE SET 
        account_type = EXCLUDED.account_type,
        updated_at = CURRENT_TIMESTAMP
      WHERE 
        (accounts.account_type = 'viewer' AND EXCLUDED.account_type = 'manager')
      OR
        (accounts.account_type = 'manager' AND EXCLUDED.account_type = 'manager')
      `,
      [address, accountType],
    );
    return;
  } catch (err) {
    console.error("upsertAccountInfoForNewActivity: db error", err);
    throw new Error("upsert client account: db error");
  }
}
