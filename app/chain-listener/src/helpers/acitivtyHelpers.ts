import { PoolClient } from "pg";
import { ActivityInput, ActivityStatus } from "../types/activity.types";
import { query } from "../db";

export async function insertNewActivity(
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

// only for use of dbHandler, move it there later, internal function.
export async function changeStatus(
  client: PoolClient,
  activityId: bigint,
  status: "on_chain" | "failed" | "db_only"
) {
  await client.query(
    `
      UPDATE activity
      SET status = $1,
          updated_at = now()
      WHERE id = $2
      `,
    [status, activityId.toString()]
  );

  return;
}

export async function changeStatusFailedExcept(
  evidenceId: string,
  client: PoolClient,
  targetActivityId: bigint,
  type: "create" | "transfer" | "discontinue"
) {
  await client.query(
    `
      UPDATE activity
      SET status = 'failed',
          updated_at = now()
      WHERE id <> $1
        AND evidence_id = $2
        AND type = $3
      `,
    [targetActivityId.toString(), evidenceId, type]
  );

  return;
}
