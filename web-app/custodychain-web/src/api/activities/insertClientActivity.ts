"use server";

import { query } from "@/src/config/db";
import {
  upsertAccountInfoForNewActivity,
  accountType,
} from "../account/upsertAccountInfo";
import {
  ActivityInputSchema,
  ActivityInputType,
} from "@/src/lib/types/activity.types";

type clientStatus = "client_only" | "pending";

export async function insertClientActivity(input: ActivityInputType) {
  const result = ActivityInputSchema.safeParse(input);
  if (!result.success) {
    console.log("insert client: ", result.error);
    throw new Error("invalid activity");
  }
  const safeInput = result.data;

  const initialStatus: clientStatus =
    safeInput.type === "fetch" ? "client_only" : "pending";
  const initialType: accountType =
    safeInput.type === "fetch" ? "viewer" : "manager";

  try {
    await upsertAccountInfoForNewActivity(safeInput.actor, initialType);
    await insertNewActivity(initialStatus, safeInput);
  } catch (err) {
    console.error(
      "insertClientActivity: couldn't insert activity into DB",
      err,
    );
    throw new Error("insert pending client activity: db error");
  }
}

async function insertNewActivity(
  status: clientStatus,
  activityInfo: ActivityInputType,
) {
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
      updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
    `,
    [
      activityInfo.evidenceId.toLowerCase(),
      activityInfo.actor.toLowerCase(),
      activityInfo.type,
      activityInfo.owner.toLowerCase(),
      status,
      activityInfo.txHash?.toLowerCase(),
      blockNumber.toString(),
      meta,
      activityInfo.initializedAt,
    ],
  );
}
