import { query } from "./db";
import { logger } from "./logger";

interface UpsertAccountParams {
  address: `0x${string}`;
  accountType?: "viewer" | "manager";
}

export async function upsertAccountInfo({
  address,
  accountType = "viewer",
}: UpsertAccountParams): Promise<void> {
  try {
    await query(
      `
      INSERT INTO accounts (address, account_type)
      VALUES ($1, $2)
      ON CONFLICT (address) 
      DO UPDATE SET 
      updated_at = CURRENT_TIMESTAMP;
      `,
      [address, accountType]
    );

    logger.info("upsertAccountInfo: done", {
      address,
      accountType,
    });
  } catch (err) {
    logger.error("upsertAccountInfo error", err);
    throw err;
  }
}
