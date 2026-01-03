"use server";

import { logger } from "../../logger";
import { insertNewActivity } from "../../helpers/acitivtyHelpers";
import { upsertAccountInfo } from "../../upsertAccountInfo";
import { ActivityInput, ActivityInputSchema } from "../../types/activity.types";
import { Address } from "viem";
import { z } from "zod";

export async function insertClientActivity(input: ActivityInput) {
  // do not trust client input. always check data types.
  const result = ActivityInputSchema.safeParse(input);
  if (!result.success) {
    logger.error(
      "insertClientActivity: Activity was not inserted in db, invalid activity ActivityInput type.",
      z.prettifyError(result.error)
    );
    throw new Error("DB: Activity Insertion failed");
  }
  const safeInput = result.data;

  const initialStatus = safeInput.type === "fetch" ? "client_only" : "pending";
  try {
    // next js inserts account address, check other implementations later if required
    await upsertAccountInfo({
      address: safeInput.actor as Address,
      accountType: "manager",
    });
    await insertNewActivity(initialStatus, safeInput);
  } catch (err) {
    logger.error("insertClientActivity: couldn't insert activity into DB", err);
    throw err;
  }
  return;
}
