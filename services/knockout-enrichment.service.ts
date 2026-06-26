import { TOURNAMENT_CODE } from "@/lib/constants";
import { query } from "@/lib/db";
import {
  computeGroupStandingsFromMatches,
  type ComputedGroupTable
} from "@/lib/group-standings-compute";
import {
  findKnockoutMismatches,
  hasRealTeamId,
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

async function loadTeamName(teamId: string) {
  const { rows } = await query<{ name: string }>(
    `SELECT name FROM teams_cache WHERE external_id = $1 LIMIT 1`,
    [teamId]
  );
  return rows[0]?.name ?? null;
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

    const nextHome = hasRealTeamId(row.home_team_id)
      ? row.home_team_id
      : local.homeTeamId;
    const nextAway = hasRealTeamId(row.away_team_id)
      ? row.away_team_id
      : local.awayTeamId;

    if (nextHome === row.home_team_id && nextAway === row.away_team_id) {
      continue;
    }

    const payload = { ...(row.payload ?? {}) };
    if (nextHome && nextHome !== row.home_team_id) {
      const name = await loadTeamName(nextHome);
      if (name) {
        payload.home_team_name_en = name;
        payload.home_team_label = name;
      }
      filledSlots += 1;
    }
    if (nextAway && nextAway !== row.away_team_id) {
      const name = await loadTeamName(nextAway);
      if (name) {
        payload.away_team_name_en = name;
        payload.away_team_label = name;
      }
      filledSlots += 1;
    }

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
