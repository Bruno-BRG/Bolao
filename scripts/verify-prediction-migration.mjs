#!/usr/bin/env node
/**
 * Verifica que o backfill de match_predictions bate com o JSON legado.
 * Uso: DATABASE_URL=... node scripts/verify-prediction-migration.mjs
 */

import pg from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Defina DATABASE_URL");
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: connectionString.includes("railway") || connectionString.includes("rlwy.net")
    ? { rejectUnauthorized: false }
    : undefined
});

await client.connect();

const { rows: counts } = await client.query(`
  SELECT
    (SELECT count(*)::int FROM user_predictions WHERE tournament_code = 'WC2026') AS users,
    (SELECT count(*)::int FROM match_predictions WHERE tournament_code = 'WC2026') AS normalized_rows,
    (
      SELECT coalesce(sum(jsonb_object_length(coalesce(predictions->'matches', '{}'::jsonb))), 0)::int
      FROM user_predictions
      WHERE tournament_code = 'WC2026'
    ) AS json_match_entries
`);

const { rows: mismatches } = await client.query(`
  WITH legacy AS (
    SELECT
      up.user_id,
      m.key AS match_external_id,
      coalesce((m.value->>'homeGoals')::int, 0) AS home_goals,
      coalesce((m.value->>'awayGoals')::int, 0) AS away_goals
    FROM user_predictions up
    CROSS JOIN LATERAL jsonb_each(coalesce(up.predictions->'matches', '{}'::jsonb)) AS m(key, value)
    WHERE up.tournament_code = 'WC2026'
  )
  SELECT count(*)::int AS missing_in_normalized
  FROM legacy l
  LEFT JOIN match_predictions mp
    ON mp.user_id = l.user_id
   AND mp.tournament_code = 'WC2026'
   AND mp.match_external_id = l.match_external_id
   AND mp.home_goals = l.home_goals
   AND mp.away_goals = l.away_goals
  WHERE mp.user_id IS NULL
`);

const { rows: sizes } = await client.query(`
  SELECT
    pg_size_pretty(sum(pg_column_size(predictions))::bigint) AS legacy_json_size,
    pg_size_pretty(sum(pg_column_size(bracket) + pg_column_size(top_four))::bigint) AS extracted_size,
    pg_size_pretty(
      (SELECT sum(pg_column_size(mp.*)) FROM match_predictions mp WHERE tournament_code = 'WC2026')::bigint
    ) AS normalized_size
  FROM user_predictions
  WHERE tournament_code = 'WC2026'
`);

console.log(JSON.stringify({ counts: counts[0], mismatches: mismatches[0], sizes: sizes[0] }, null, 2));

const ok =
  counts[0].normalized_rows === counts[0].json_match_entries &&
  mismatches[0].missing_in_normalized === 0;

if (!ok) {
  console.error("VERIFICACAO FALHOU — nao apague o JSON legado.");
  process.exit(1);
}

console.log("OK — dados normalizados conferem com o JSON legado.");
await client.end();
