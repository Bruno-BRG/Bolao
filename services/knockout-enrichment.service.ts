import { TOURNAMENT_CODE } from "@/lib/constants";
import { query } from "@/lib/db";
import {
  computeGroupStandingsFromMatches,
  type ComputedGroupTable
} from "@/lib/group-standings-compute";
import {
  findKnockoutMismatches,
  resolveAllKnockoutTeams
} from "@/lib/knockout-resolver";
import type { Match, Team } from "@/types/domain";

type CachedMatch = {
  external_id: string;
  home_team_id: string | null;
  away_team_id: string | null;
  stage: string | null;
  group_name: string | null;
  status: string;
  score_home: number | null;
  score_away: number | null;
  payload: Record<string, unknown>;
};

type CachedTeam = Team;

export type KnockoutEnrichmentResult = {
  filledSlots: number;
  mismatches: ReturnType<typeof findKnockoutMismatches>;
  groupsSynced: number;
};

async function loadTeams(): Promise<CachedTeam[]> {
  const { rows } = await query<CachedTeam>(
    `SELECT external_id, fifa_code, iso2, name, flag_url, payload
     FROM teams_cache`
  );
  return rows;
}

async function loadMatches(): Promise<CachedMatch[]> {
  const { rows } = await query<CachedMatch>(
    `SELECT external_id, home_team_id, away_team_id, stage, group_name, status,
            score_home, score_away, payload
     FROM matches_cache
     WHERE tournament_code = $1`,
    [TOURNAMENT_CODE]
  );
  return rows;
}

function toDomainMatch(row: CachedMatch): Match {
  return {
    external_id: row.external_id,
    tournament_code: TOURNAMENT_CODE,
    home_team_id: row.home_team_id,
    away_team_id: row.away_team_id,
    starts_at: "",
    stage: row.stage,
    group_name: row.group_name,
    status: row.status,
    score_home: row.score_home,
    score_away: row.score_away,
    payload: row.payload
  };
}

async function syncComputedGroups(tables: ComputedGroupTable[]) {
  let synced = 0;
  for (const table of tables) {
    for (const [index, row] of table.standings.entries()) {
      await query(
        `INSERT INTO groups_cache (
           tournament_code, group_name, team_id, position, mp, w, d, l, pts, gf, ga, gd, updated_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
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
           updated_at = NOW()`,
        [
          TOURNAMENT_CODE,
          table.group,
          row.teamId,
          index + 1,
          row.mp,
          row.w,
          row.d,
          row.l,
          row.pts,
          row.gf,
          row.ga,
          row.gd
        ]
      );
      synced += 1;
    }
  }
  return synced;
}

function apiHasTeamId(payload: Record<string, unknown>, side: "home" | "away") {
  const key = side === "home" ? "home_team_id" : "away_team_id";
  const value = payload[key];
  return typeof value === "string" && value !== "" && value !== "0";
}

export async function enrichKnockoutBracketFromStandings(): Promise<KnockoutEnrichmentResult> {
  const [teams, rows] = await Promise.all([loadTeams(), loadMatches()]);
  const matches = rows.map(toDomainMatch);
  const { resolved, tables } = resolveAllKnockoutTeams(matches, teams);
  const mismatches = findKnockoutMismatches(matches, teams);

  let filledSlots = 0;

  for (const row of rows) {
    if (row.stage === "Grupos") continue;

    const local = resolved.get(row.external_id);
    if (!local) continue;

    const payload = row.payload ?? {};
    const apiHome = apiHasTeamId(payload, "home");
    const apiAway = apiHasTeamId(payload, "away");

    const nextHome = apiHome ? row.home_team_id : (local.homeTeamId ?? null);
    const nextAway = apiAway ? row.away_team_id : (local.awayTeamId ?? null);

    if (nextHome === row.home_team_id && nextAway === row.away_team_id) {
      continue;
    }

    if (nextHome && nextHome !== row.home_team_id) filledSlots += 1;
    if (nextAway && nextAway !== row.away_team_id) filledSlots += 1;

    await query(
      `UPDATE matches_cache
       SET home_team_id = $1,
           away_team_id = $2,
           payload = $3,
           updated_at = NOW()
       WHERE external_id = $4 AND tournament_code = $5`,
      [nextHome, nextAway, payload, row.external_id, TOURNAMENT_CODE]
    );
  }

  const groupsSynced = tables.length > 0 ? await syncComputedGroups(tables) : 0;

  return {
    filledSlots,
    mismatches,
    groupsSynced
  };
}

export function summarizeKnockoutEnrichment(result: KnockoutEnrichmentResult) {
  const parts = [
    `filled ${result.filledSlots} knockout slot(s)`,
    `synced ${result.groupsSynced} group row(s)`
  ];
  if (result.mismatches.length > 0) {
    parts.push(`${result.mismatches.length} API/local mismatch(es)`);
  }
  return parts.join(", ");
}
