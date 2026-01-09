import { Pool } from "postgres";

const pool = new Pool({
  hostname: Deno.env.get("DB_HOST") || "localhost",
  port: 5432,
  user: Deno.env.get("DB_USER") || "postgres",
  password: Deno.env.get("DB_PASSWORD") || "postgres",
  database: Deno.env.get("DB_NAME") || "events_app",
}, 10);

export async function query<T>(sql: string, args: unknown[] = []): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result = await client.queryObject<T>(sql, args);
    return result.rows;
  } finally {
    client.release();
  }
}
