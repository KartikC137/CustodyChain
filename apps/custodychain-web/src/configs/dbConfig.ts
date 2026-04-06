import { Pool, PoolClient, QueryResult } from "pg";
import { requireEnv } from "./envConfig";

const DATABASE_URL = requireEnv("DATABASE_URL");

export const pool = new Pool({
  connectionString: DATABASE_URL,
});

export async function query(
  text: string,
  params?: any[],
): Promise<QueryResult> {
  return pool.query(text, params);
}

export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Transaction failed", err);
    throw err;
  } finally {
    client.release();
  }
}

export async function closeDB() {
  console.info("Closing DB pool...");
  await pool.end();
}
