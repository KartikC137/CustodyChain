import { query } from "../../lib/db";
import { Address } from "@/lib/types/solidity.types";

interface UpsertAccountParams {
  address: Address;
  accountType?: "viewer" | "manager";
}

export async function upsertAccountInfoForNewActivity({
  address,
  accountType,
}: UpsertAccountParams): Promise<void> {
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
      [address, accountType]
    );
    console.log("upsertAccountInfoForNewActivity: done", {
      address,
      accountType,
    });
  } catch (err) {
    console.error("upsertAccountInfoForNewActivity error", err);
    throw err;
  }
}
