import { Pool, PoolClient, QueryResult } from "pg";
import { config } from "./config.js";
import { logger } from "../logger.js";

export const pool = new Pool({
  connectionString: config.DATABASE_URL,
});

export async function query(
  text: string,
  params?: any[]
): Promise<QueryResult> {
  return pool.query(text, params);
}

export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    logger.error("Transaction failed", err);
    throw err;
  } finally {
    client.release();
  }
}

export async function closeDB() {
  logger.info("Closing DB pool...");
  await pool.end();
}
