import pg from "pg";
const c = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
await c.connect();
const r = await c.query(`
  SELECT external_id, group_name, stage, status, starts_at
  FROM matches_cache
  WHERE tournament_code = 'WC2026'
  ORDER BY starts_at
  LIMIT 15
`);
console.log(JSON.stringify(r.rows, null, 2));
await c.end();
