#!/usr/bin/env node
/**
 * Smoke test de producao: health, login, save no banco, leitura de volta.
 * Uso:
 *   BOLAO_URL=https://bolao.brunorocha.dev.br \
 *   BOLAO_USERNAME=bruno \
 *   BOLAO_PASSWORD=*** \
 *   DATABASE_URL=... \
 *   node scripts/e2e-prod-check.mjs
 */

import crypto from "node:crypto";
import pg from "pg";

const baseUrl = (process.env.BOLAO_URL ?? "https://bolao.brunorocha.dev.br").replace(/\/$/, "");
const username = process.env.BOLAO_USERNAME ?? "bruno";
const password = process.env.BOLAO_PASSWORD;
const connectionString = process.env.DATABASE_URL;

if (!password || !connectionString) {
  console.error("Defina BOLAO_PASSWORD e DATABASE_URL");
  process.exit(1);
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function createSessionToken() {
  return crypto.randomBytes(32).toString("base64url");
}

async function checkHealth() {
  const health = await fetch(`${baseUrl}/api/health`, { cache: "no-store" });
  const live = await fetch(`${baseUrl}/api/live`, { cache: "no-store" });
  const healthBody = await health.json();
  const liveBody = await live.json();
  return {
    health: { status: health.status, body: healthBody },
    live: { status: live.status, body: liveBody }
  };
}

async function loginWithForm() {
  const body = new URLSearchParams({ username, password });
  const response = await fetch(`${baseUrl}/login`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
    redirect: "manual"
  });

  const setCookie = response.headers.getSetCookie?.() ?? [];
  const sessionCookie = setCookie.find((value) => value.startsWith("bolao_session="));
  return {
    status: response.status,
    location: response.headers.get("location"),
    hasSession: Boolean(sessionCookie),
    sessionCookie: sessionCookie?.split(";")[0] ?? null
  };
}

async function dbSaveRoundTrip(client, userId) {
  const match = await client.query(
    `SELECT external_id, home_team_id, away_team_id, status, starts_at
     FROM matches_cache
     WHERE tournament_code = 'WC2026'
       AND upper(status) = 'SCHEDULED'
       AND home_team_id IS NOT NULL
       AND away_team_id IS NOT NULL
       AND starts_at > NOW()
     ORDER BY starts_at
     LIMIT 1`
  );

  if (!match.rows[0]) {
    return { skipped: true, reason: "no open match" };
  }

  const matchId = match.rows[0].external_id;
  const marker = 2 + (Date.now() % 5);

  await client.query("BEGIN");
  try {
    await client.query(
      `INSERT INTO match_predictions (
         user_id, tournament_code, match_external_id, home_team_id, away_team_id,
         home_goals, away_goals, saved_at, locked
       ) VALUES ($1, 'WC2026', $2, $3, $4, $5, 0, NOW(), false)
       ON CONFLICT (user_id, tournament_code, match_external_id) DO UPDATE SET
         home_goals = EXCLUDED.home_goals,
         away_goals = EXCLUDED.away_goals,
         saved_at = NOW()`,
      [
        userId,
        matchId,
        match.rows[0].home_team_id,
        match.rows[0].away_team_id,
        marker
      ]
    );

    const read = await client.query(
      `SELECT home_goals, away_goals
       FROM match_predictions
       WHERE user_id = $1 AND match_external_id = $2`,
      [userId, matchId]
    );

    await client.query("ROLLBACK");

    const row = read.rows[0];
    return {
      skipped: false,
      matchId,
      marker,
      ok: row?.home_goals === marker && row?.away_goals === 0
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

const client = new pg.Client({
  connectionString,
  ssl: connectionString.includes("railway") || connectionString.includes("rlwy.net")
    ? { rejectUnauthorized: false }
    : undefined
});

await client.connect();

const user = await client.query(
  `SELECT id FROM users WHERE username = $1 LIMIT 1`,
  [username]
);
if (!user.rows[0]) {
  console.error("Usuario de teste nao encontrado:", username);
  process.exit(1);
}

const health = await checkHealth();
const login = await loginWithForm();
const save = await dbSaveRoundTrip(client, user.rows[0].id);

const counts = await client.query(`
  SELECT
    (SELECT count(*)::int FROM match_predictions mp
      JOIN users u ON u.id = mp.user_id
      WHERE u.username = $1) AS saved_rows,
    (SELECT count(*)::int FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE u.username = $1 AND s.revoked_at IS NULL AND s.expires_at > NOW()) AS active_sessions
`, [username]);

await client.end();

const ok =
  health.health.status === 200 &&
  health.health.body?.database === "ok" &&
  health.live.status === 200 &&
  login.hasSession &&
  save.ok !== false;

console.log(
  JSON.stringify(
    {
      ok,
      health,
      login: { status: login.status, location: login.location, hasSession: login.hasSession },
      save,
      counts: counts.rows[0]
    },
    null,
    2
  )
);

if (!ok) process.exit(1);
console.log("E2E OK");
