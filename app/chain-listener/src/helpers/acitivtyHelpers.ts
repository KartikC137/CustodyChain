import { PoolClient } from "pg";
import { query } from "../db.js";
import { logger } from "../logger.js";
import { getIO } from "../socket.js";

// for client activities only.
export async function updateActivityForClient(
  activityId: bigint,
  status: "client_only" | "failed",
  txHash: `0x${string}` | null,
  blockNumber: bigint | null,
  error?: string
) {
  const io = getIO();
  let result;
  try {
    if (status === "failed") {
      result = await query(
        `
        UPDATE activity
        SET status = 'failed',
            updated_at = now(),
            tx_hash = $1,
            block_number = $2,
            meta = jsonb_set(
            COALESCE(meta, '{}'),
            '{error}',
            to_jsonb($3::text),
            true
          )
        WHERE id = $4
        RETURNING updated_at,actor,evidence_id
        `,
        [
          txHash ? txHash.toLowerCase() : null,
          blockNumber ? blockNumber.toString() : null,
          String(error || "unknown error"),
          activityId.toString(),
        ]
      );
    } else if (status === "client_only" && txHash) {
      result = await query(
        `
        UPDATE activity
        SET status = 'client_only',
            tx_hash = $1,
            block_number = $2,
            updated_at = now()
        WHERE id = $3
        RETURNING updated_at,actor,evidence_id
        `,
        [
          txHash.toLowerCase(),
          blockNumber ? blockNumber.toString() : null,
          activityId.toString(),
        ]
      );
    }

    const newUpdatedAt = result?.rows[0].updated_at;
    const account = result?.rows[0].actor;
    const evidence_id = result?.rows[0].evidence_id;

    io.emit("activity:update", {
      activityId: activityId.toString(),
      status: status,
      account: account,
      evidenceId: evidence_id,
      txHash: txHash ? txHash.toLowerCase() : null,
      updatedAt: newUpdatedAt,
      error: error,
    });
    logger.info(
      `dispatchActivity: emit socket event : Account: ${account} evidence: ${evidence_id} updatedAt: ${newUpdatedAt}`
    );
  } catch (err) {
    logger.error(
      "dispatchActivity: updateActivityForClient failed. Query error:",
      err
    );
    throw new Error("Update activity failed.");
    //TODO emit socket event here to handle db failures
  }
  return;
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
