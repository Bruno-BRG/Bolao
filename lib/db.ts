import pg from "pg";

const { Pool } = pg;

let pool: pg.Pool | null = null;

function resolveConnectionString() {
  const direct = process.env.DATABASE_URL;
  const publicUrl = process.env.DATABASE_PUBLIC_URL;

  if (direct?.includes("railway.internal") && publicUrl) {
    return publicUrl;
  }

  if (!direct) {
    throw new Error("Missing DATABASE_URL environment variable.");
  }

  return direct;
}

function buildPoolConfig(): pg.PoolConfig {
  const connectionString = resolveConnectionString();

  const useSsl =
    connectionString.includes("railway.app") ||
    connectionString.includes("rlwy.net") ||
    connectionString.includes("railway.internal") ||
    process.env.DATABASE_SSL === "true";

  return {
    connectionString,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    max: Number(process.env.PG_POOL_MAX ?? "5"),
    idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS ?? "10000"),
    connectionTimeoutMillis: Number(process.env.PG_CONNECT_TIMEOUT_MS ?? "10000")
  };
}

function isConnectionError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: string; message?: string };
  return (
    candidate.code === "ECONNREFUSED" ||
    candidate.code === "ETIMEDOUT" ||
    candidate.code === "57P01" ||
    candidate.code === "08006" ||
    candidate.message?.includes("Connection terminated unexpectedly") === true
  );
}

export async function resetPool() {
  if (!pool) return;
  try {
    await pool.end();
  } catch {
    // Ignore errors while tearing down a broken pool.
  }
  pool = null;
}

export function getPool() {
  if (!pool) {
    pool = new Pool(buildPoolConfig());
    pool.on("error", (error) => {
      console.error("[db] idle pool client error:", error.message);
    });
  }
  return pool;
}

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[]
) {
  try {
    return await getPool().query<T>(text, params);
  } catch (error) {
    if (!isConnectionError(error)) throw error;
    await resetPool();
    return getPool().query<T>(text, params);
  }
}
