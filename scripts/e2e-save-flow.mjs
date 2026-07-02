#!/usr/bin/env node
/**
 * E2E real: sessao -> server action saveMatchPredictionAction -> confere banco.
 */

import crypto from "node:crypto";
import pg from "pg";

const baseUrl = (process.env.BOLAO_URL ?? "https://bolao.brunorocha.dev.br").replace(/\/$/, "");
const username = process.env.BOLAO_USERNAME ?? "bruno";
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL required");
  process.exit(1);
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function createSessionToken() {
  return crypto.randomBytes(32).toString("base64url");
}

async function createSession(client, userId) {
  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await client.query(
    `INSERT INTO sessions (user_id, session_token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, hashToken(token), expiresAt]
  );
  return token;
}

async function findSaveActionId(cookie) {
  const pageRes = await fetch(`${baseUrl}/palpites`, {
    headers: { cookie, accept: "text/html" }
  });
  const pageHtml = await pageRes.text();

  const chunkMatch = pageHtml.match(/\/_next\/static\/chunks\/app\/palpites\/page-[^"]+\.js/);
  if (!chunkMatch) {
    return { pageStatus: pageRes.status, pageUrl: pageRes.url, actionId: null };
  }

  const chunkRes = await fetch(`${baseUrl}${chunkMatch[0]}`);
  const chunkJs = await chunkRes.text();
  const actionMatch = chunkJs.match(
    /createServerReference\)\("([a-f0-9]+)"[^)]*"saveMatchPredictionAction"\)/
  );

  return {
    pageStatus: pageRes.status,
    pageUrl: pageRes.url,
    chunk: chunkMatch[0],
    actionId: actionMatch?.[1] ?? null
  };
}

async function pickOpenMatch(client) {
  const { rows } = await client.query(
    `SELECT external_id, home_team_id, away_team_id, group_name, stage
     FROM matches_cache
     WHERE tournament_code = 'WC2026'
       AND upper(status) = 'SCHEDULED'
       AND home_team_id IS NOT NULL
       AND away_team_id IS NOT NULL
       AND (group_name IS NOT NULL OR stage ILIKE '%grupo%')
     ORDER BY starts_at
     LIMIT 1`
  );
  if (rows[0]) return rows[0];

  const fallback = await client.query(
    `SELECT external_id, home_team_id, away_team_id, group_name, stage
     FROM matches_cache
     WHERE tournament_code = 'WC2026'
       AND upper(status) = 'SCHEDULED'
       AND home_team_id IS NOT NULL
       AND away_team_id IS NOT NULL
     ORDER BY starts_at
     LIMIT 1`
  );
  return fallback.rows[0] ?? null;
}

async function readPrediction(client, userId, matchId) {
  const { rows } = await client.query(
    `SELECT home_goals, away_goals, saved_at
     FROM match_predictions
     WHERE user_id = $1 AND tournament_code = 'WC2026' AND match_external_id = $2`,
    [userId, matchId]
  );
  return rows[0] ?? null;
}

const client = new pg.Client({
  connectionString,
  ssl: connectionString.includes("railway") || connectionString.includes("rlwy.net")
    ? { rejectUnauthorized: false }
    : undefined
});

await client.connect();

const user = await client.query(`SELECT id FROM users WHERE username = $1 LIMIT 1`, [username]);
const userId = user.rows[0]?.id;
if (!userId) throw new Error(`User ${username} not found`);

const match = await pickOpenMatch(client);
if (!match) throw new Error("No open match for test");

const before = await readPrediction(client, userId, match.external_id);
const newHome = 2;
const newAway = 1;

const sessionToken = await createSession(client, userId);
const cookie = `bolao_session=${sessionToken}`;

const actionLookup = await findSaveActionId(cookie);
let saveViaAction = {
  attempted: false,
  ok: false,
  status: null,
  body: null,
  ...actionLookup
};

if (actionLookup.actionId) {
  saveViaAction.attempted = true;
  const actionRes = await fetch(`${baseUrl}/palpites`, {
    method: "POST",
    headers: {
      cookie,
      accept: "text/x-component",
      "content-type": "text/plain;charset=UTF-8",
      "next-action": actionLookup.actionId
    },
    body: JSON.stringify([
      {
        matchId: match.external_id,
        homeGoals: newHome,
        awayGoals: newAway,
        predictedWinnerTeamId: null,
        predictedDecidedBy: null
      }
    ])
  });

  saveViaAction.status = actionRes.status;
  saveViaAction.body = (await actionRes.text()).slice(0, 800);
  saveViaAction.ok =
    actionRes.ok &&
    (saveViaAction.body.includes('"ok":true') || saveViaAction.body.includes('"ok": true'));
}

const afterAction = await readPrediction(client, userId, match.external_id);
const actionChangedDb =
  afterAction?.home_goals === newHome && afterAction?.away_goals === newAway;

// restaura
if (before) {
  await client.query(
    `UPDATE match_predictions
     SET home_goals = $3, away_goals = $4, saved_at = $5
     WHERE user_id = $1 AND match_external_id = $2`,
    [userId, match.external_id, before.home_goals, before.away_goals, before.saved_at]
  );
} else if (actionChangedDb) {
  await client.query(
    `DELETE FROM match_predictions WHERE user_id = $1 AND match_external_id = $2`,
    [userId, match.external_id]
  );
}

await client.query(
  `UPDATE sessions SET revoked_at = NOW() WHERE session_token_hash = $1`,
  [hashToken(sessionToken)]
);

await client.end();

const result = {
  user: username,
  matchId: match.external_id,
  matchMeta: { group: match.group_name, stage: match.stage },
  before,
  attempted: { homeGoals: newHome, awayGoals: newAway },
  saveViaAction,
  afterAction,
  actionChangedDb,
  restored: true,
  fullUserFlowOk: actionChangedDb
};

console.log(JSON.stringify(result, null, 2));

if (!actionChangedDb) process.exit(1);
console.log("FULL USER FLOW OK — server action salvou no banco.");
