import pg from "pg";

const client = new pg.Client({
  host: "reseau.proxy.rlwy.net",
  port: 56819,
  user: "postgres",
  password: process.env.RAILWAY_DB_PASSWORD,
  database: "railway",
  ssl: { rejectUnauthorized: false }
});

await client.connect();
const { rows } = await client.query(`
  SELECT 'users' AS t, count(*)::int AS n FROM users
  UNION ALL SELECT 'predictions', count(*)::int FROM user_predictions
  UNION ALL SELECT 'matches', count(*)::int FROM matches_cache
  UNION ALL SELECT 'teams', count(*)::int FROM teams_cache
  UNION ALL SELECT 'ranking', count(*)::int FROM ranking_snapshots
  UNION ALL SELECT 'sync_logs', count(*)::int FROM sync_logs
  UNION ALL SELECT 'sessions', count(*)::int FROM sessions
  UNION ALL SELECT 'groups', count(*)::int FROM groups_cache
  UNION ALL SELECT 'tournaments', count(*)::int FROM tournaments
`);
console.log(JSON.stringify(rows, null, 2));
await client.end();
