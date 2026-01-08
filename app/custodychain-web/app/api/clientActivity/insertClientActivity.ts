"use server";

import { upsertAccountInfoForNewActivity } from "../upsertAccountInfo";
import { Address } from "viem";

import {
  ActivityInputSchema,
  ActivityInput,
  ActivityStatus,
} from "@/lib/types/activity.types";
import { z } from "zod";
import { query } from "../../../lib/db";
import { PoolClient } from "pg";

// TODO: maybe remove return of activity id
export async function insertClientActivity(
  input: ActivityInput
): Promise<bigint> {
  // do not trust client input. always check data types.
  const result = ActivityInputSchema.safeParse(input);
  if (!result.success) {
    console.error(
      "insertClientActivity: Activity was not inserted in db, invalid activity ActivityInput type.",
      z.prettifyError(result.error)
    );
    throw new Error("DB: Activity Insertion failed");
  }
  const safeInput = result.data;

  const initialStatus = safeInput.type === "fetch" ? "client_only" : "pending";
  const initialType = safeInput.type === "fetch" ? "viewer" : "manager";

  try {
    await upsertAccountInfoForNewActivity({
      address: safeInput.actor as Address,
      accountType: initialType,
    });
    const activityId = await insertNewActivity(initialStatus, safeInput);
    return activityId;
  } catch (err) {
    console.error(
      "insertClientActivity: couldn't insert activity into DB",
      err
    );
    throw err;
  }
}

async function insertNewActivity(
  status: ActivityStatus,
  activityInfo: ActivityInput,
  client?: PoolClient // if using client.withTransaction()
): Promise<bigint> {
  let from, to;
  if (activityInfo.type === "transfer") {
    from = activityInfo.from ? activityInfo.from.toLowerCase() : null;
    to = activityInfo.to ? activityInfo.to.toLowerCase() : null;
  }
  const meta = activityInfo.meta ?? {};
  const blockNumber = activityInfo.blockNumber ?? 0;

  const sql = `
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
    `;

  const params = [
    activityInfo.contractAddress.toLowerCase(),
    activityInfo.evidenceId.toLowerCase(),
    activityInfo.actor.toLowerCase(),
    activityInfo.type,
    from?.toLowerCase(),
    to?.toLowerCase(),
    status,
    activityInfo.txHash?.toLowerCase(),
    blockNumber.toString(),
    meta,
  ];
  let result;
  if (client) {
    result = await client.query(sql, params);
  } else {
    result = await query(sql, params);
  }

  const row = result.rows[0];
  if (!row) throw new Error("Insert failed, no ID returned");

  return BigInt(row.id);
}
