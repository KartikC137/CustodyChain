"use server";

import { query } from "@/src/config/db";
import {
  upsertAccountInfoForNewActivity,
  accountType,
} from "../account/upsertAccountInfo";
import {
  ActivityInputSchema,
  ActivityInput,
} from "@/src/lib/types/activity.types";

type clientStatus = "client_only" | "pending";

export async function insertClientActivity(
  input: ActivityInput,
): Promise<bigint> {
  const result = ActivityInputSchema.safeParse(input);
  if (!result.success) {
    throw new Error("invalid activity");
  }
  const safeInput = result.data;

  const initialStatus: clientStatus =
    safeInput.type === "fetch" ? "client_only" : "pending";
  const initialType: accountType =
    safeInput.type === "fetch" ? "viewer" : "manager";

  try {
    await upsertAccountInfoForNewActivity(safeInput.actor, initialType);
    const activityId = await insertNewActivity(initialStatus, safeInput);
    if (!activityId) throw new Error("insert activity failed");
    return activityId;
  } catch (err) {
    console.error(
      "insertClientActivity: couldn't insert activity into DB",
      err,
    );
    throw err;
  }
}

async function insertNewActivity(
  status: clientStatus,
  activityInfo: ActivityInput,
): Promise<bigint> {
  let from,
    to = null;
  if (activityInfo.type === "transfer") {
    from = activityInfo.from.toLowerCase();
    to = activityInfo.to.toLowerCase();
  }
  const meta = activityInfo.meta ?? {};
  const blockNumber = activityInfo.blockNumber ?? 0n;

  const result = await query(
    `
    INSERT INTO activity (
      contract_address,
      evidence_id,
      actor,
      type,
      from_addr,
      to_addr,
      status,
      tx_hash,
      block_number,
      meta,
      initialized_at,
      updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now(), now())
    RETURNING id
    `,
    [
      activityInfo.contractAddress.toLowerCase(),
      activityInfo.evidenceId.toLowerCase(),
      activityInfo.actor.toLowerCase(),
      activityInfo.type,
      from,
      to,
      status,
      activityInfo.txHash?.toLowerCase(),
      blockNumber.toString(),
      meta,
    ],
  );
  return BigInt(result.rows[0].id);
}
