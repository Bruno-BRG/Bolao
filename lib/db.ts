import pg from "pg";

const { Pool } = pg;

let pool: pg.Pool | null = null;

function buildPoolConfig(): pg.PoolConfig {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("Missing DATABASE_URL environment variable.");
  }

  const useSsl =
    connectionString.includes("railway.app") ||
    connectionString.includes("rlwy.net") ||
    process.env.DATABASE_SSL === "true";

  return {
    connectionString,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined
  };
}

export function getPool() {
  if (!pool) {
    pool = new Pool(buildPoolConfig());
  }
  return pool;
}

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[]
) {
  return getPool().query<T>(text, params);
}
