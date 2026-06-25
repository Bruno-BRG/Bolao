import { TOURNAMENT_CODE } from "@/lib/constants";
import { query } from "@/lib/db";

type TeamRow = {
  external_id: string;
  fifa_code: string | null;
  iso2: string | null;
  name: string;
  flag_url: string | null;
  payload: unknown;
  updated_at: string;
};

type MatchRow = {
  external_id: string;
  tournament_code: string;
  home_team_id: string | null;
  away_team_id: string | null;
  starts_at: string;
  stage: string | null;
  group_name: string | null;
  status: string;
  score_home: number | null;
  score_away: number | null;
  payload: unknown;
  updated_at: string;
};

type GroupRow = {
  tournament_code: string;
  group_name: string;
  team_id: string;
  position: number;
  mp: number;
  w: number;
  d: number;
  l: number;
  pts: number;
  gf: number;
  ga: number;
  gd: number;
  updated_at: string;
};

export async function upsertTeams(teams: TeamRow[]) {
  for (const team of teams) {
    await query(
      `INSERT INTO teams_cache (
         external_id, fifa_code, iso2, name, flag_url, payload, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (external_id) DO UPDATE SET
         fifa_code = EXCLUDED.fifa_code,
         iso2 = EXCLUDED.iso2,
         name = EXCLUDED.name,
         flag_url = EXCLUDED.flag_url,
         payload = EXCLUDED.payload,
         updated_at = EXCLUDED.updated_at`,
      [
        team.external_id,
        team.fifa_code,
        team.iso2,
        team.name,
        team.flag_url,
        team.payload,
        team.updated_at
      ]
    );
  }
}

export async function pruneTeams(externalIds: string[]) {
  if (externalIds.length === 0) return;
  await query(`DELETE FROM teams_cache WHERE NOT (external_id = ANY($1::text[]))`, [
    externalIds
  ]);
}

export async function upsertMatches(matches: MatchRow[]) {
  for (const match of matches) {
    await query(
      `INSERT INTO matches_cache (
         external_id, tournament_code, home_team_id, away_team_id, starts_at,
         stage, group_name, status, score_home, score_away, payload, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (external_id) DO UPDATE SET
         tournament_code = EXCLUDED.tournament_code,
         home_team_id = EXCLUDED.home_team_id,
         away_team_id = EXCLUDED.away_team_id,
         starts_at = EXCLUDED.starts_at,
         stage = EXCLUDED.stage,
         group_name = EXCLUDED.group_name,
         status = EXCLUDED.status,
         score_home = EXCLUDED.score_home,
         score_away = EXCLUDED.score_away,
         payload = EXCLUDED.payload,
         updated_at = EXCLUDED.updated_at`,
      [
        match.external_id,
        match.tournament_code,
        match.home_team_id,
        match.away_team_id,
        match.starts_at,
        match.stage,
        match.group_name,
        match.status,
        match.score_home,
        match.score_away,
        match.payload,
        match.updated_at
      ]
    );
  }
}

export async function upsertGroups(groupRows: GroupRow[]) {
  for (const row of groupRows) {
    await query(
      `INSERT INTO groups_cache (
         tournament_code, group_name, team_id, position, mp, w, d, l, pts, gf, ga, gd, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (tournament_code, group_name, team_id) DO UPDATE SET
         position = EXCLUDED.position,
         mp = EXCLUDED.mp,
         w = EXCLUDED.w,
         d = EXCLUDED.d,
         l = EXCLUDED.l,
         pts = EXCLUDED.pts,
         gf = EXCLUDED.gf,
         ga = EXCLUDED.ga,
         gd = EXCLUDED.gd,
         updated_at = EXCLUDED.updated_at`,
      [
        row.tournament_code,
        row.group_name,
        row.team_id,
        row.position,
        row.mp,
        row.w,
        row.d,
        row.l,
        row.pts,
        row.gf,
        row.ga,
        row.gd,
        row.updated_at
      ]
    );
  }
}

export async function insertSyncLog(input: {
  provider: string;
  status: string;
  message?: string;
  payload?: Record<string, unknown>;
}) {
  await query(
    `INSERT INTO sync_logs (provider, status, message, payload)
     VALUES ($1, $2, $3, $4)`,
    [input.provider, input.status, input.message ?? null, input.payload ?? {}]
  );
}

export async function countMatches() {
  const { rows } = await query<{ count: number }>(
    `SELECT COUNT(*)::int AS count
     FROM matches_cache
     WHERE tournament_code = $1`,
    [TOURNAMENT_CODE]
  );
  return rows[0]?.count ?? 0;
}

export async function getLatestSuccessfulSync(provider: string) {
  const { rows } = await query<{ created_at: string; status: string }>(
    `SELECT created_at, status
     FROM sync_logs
     WHERE provider = $1 AND status = 'success'
     ORDER BY created_at DESC
     LIMIT 1`,
    [provider]
  );
  return rows[0] ?? null;
}
