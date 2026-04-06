"use server";

import { query } from "@/src/configs/dbConfig";
import {
  upsertAccountInfoForNewActivity,
  accountType,
} from "../account/upsertAccountInfo";
import {
  ActivityInputSchema,
  ActivityInput,
} from "@/src/lib/types/activity.types";

type clientStatus = "pending";

// todo remove types fetch from activity_type_t from DB

export async function insertClientActivity(
  input: ActivityInput,
  chainId: number,
) {
  const result = ActivityInputSchema.safeParse(input);
  if (!result.success) {
    console.log("insert client: ", result.error);
    throw new Error("invalid activity");
  }
  const safeInput = result.data;

  try {
    await upsertAccountInfoForNewActivity(safeInput.actor, "manager");
    await insertNewActivity(safeInput, chainId);
  } catch (err) {
    console.error(
      "insertClientActivity: couldn't insert activity into DB",
      err,
    );
    throw new Error(`insert pending client activity: db error`);
  }
}

async function insertNewActivity(activityInfo: ActivityInput, chainId: number) {
  const meta = activityInfo.meta ?? {};
  const blockNumber = activityInfo.blockNumber ?? 0n;

  await query(
    `
    INSERT INTO activity (
      evidence_id,
      actor,
      type,
      owner,
      status,
      tx_hash,
      block_number,
      meta,
      initialized_at,
      updated_at,
      chain_id
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9, $10)
    `,
    [
      activityInfo.evidenceId.toLowerCase(),
      activityInfo.actor.toLowerCase(),
      activityInfo.type,
      activityInfo.owner.toLowerCase(),
      "pending",
      activityInfo.txHash?.toLowerCase(),
      blockNumber.toString(),
      meta,
      activityInfo.initializedAt,
      chainId,
    ],
  );
}
