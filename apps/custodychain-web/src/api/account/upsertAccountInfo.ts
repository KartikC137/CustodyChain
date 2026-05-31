"use server";

import { query } from "@/src/configs/dbConfig";
import { Address } from "@/src/lib/types/solidity.types";

export async function upsertAccountInfo(address: Address) {
  try {
    const result = await query(
      `
      WITH inserted_account AS (
        INSERT INTO accounts (address)
        VALUES ($1)
        ON CONFLICT (address) DO NOTHING
        RETURNING id
      )
      SELECT id FROM inserted_account
      UNION ALL
      SELECT id FROM accounts WHERE address = $1
      LIMIT 1`,
      [address.toLowerCase()],
    );
    return result.rows[0].id;
  } catch (err) {
    console.error("upsertAccountInfoForNewActivity: db error", err);
    throw new Error("upsert client account: db error");
  }
}
