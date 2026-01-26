import { PoolClient } from "pg";

export const bigIntToTimeStamp = (rawTimeStamp: bigint) => {
  return new Date(Number(rawTimeStamp) * 1000);
};

// only for use of dbHandler, move it there later, internal function.
export async function changeStatus(
  client: PoolClient,
  activityId: bigint,
  status: "on_chain" | "failed" | "db_only",
) {
  await client.query(
    `
      UPDATE activity
      SET status = $1,
          updated_at = now()
      WHERE id = $2
      `,
    [status, activityId.toString()],
  );

  return;
}

export async function changeStatusFailedExcept(
  evidenceId: string,
  client: PoolClient,
  targetActivityId: bigint,
  type: "create" | "transfer" | "discontinue",
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
    [targetActivityId.toString(), evidenceId, type],
  );

  return;
}
