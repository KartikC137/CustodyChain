"use server";

import { query } from "@/src/configs/dbConfig";
import {
  ActivityInputSchema,
  ActivityInput,
} from "@/src/lib/types/activity.types";

export async function insertClientActivity(
  input: ActivityInput,
  chainId: number,
  ledgerIdDb: number,
) {
  const result = ActivityInputSchema.safeParse(input);
  if (!result.success) {
    throw new Error("invalid activity");
  }
  const activityInfo = result.data;

  try {
    await query(
      `
    INSERT INTO activity (
      evidence_id,
      actor,
      type,
      owner,
      status,
      tx_hash,
      initialized_at,
      updated_at,
      chain_id,
      ledger_id
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $8, $9)
    `,
      [
        activityInfo.evidenceId,
        activityInfo.actor,
        activityInfo.type,
        activityInfo.owner,
        "pending",
        activityInfo.txHash,
        activityInfo.initializedAt,
        chainId,
        ledgerIdDb,
      ],
    );
  } catch (err) {
    console.error(
      "insertClientActivity: couldn't insert activity into DB",
      err,
    );
    throw new Error(`insert pending client activity: db error`);
  }
}
