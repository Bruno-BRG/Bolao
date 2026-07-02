import { cache } from "react";
import { unstable_cache } from "next/cache";
import { TOURNAMENT_CODE } from "@/lib/constants";
import { PAGE_CACHE_SECONDS } from "@/lib/server-cache";
import { query } from "@/lib/db";
import { localizeTeam } from "@/lib/team-names-pt";
import {
  ensureWorldCupData,
  getWorldCupProvider
} from "@/services/worldcup-sync.service";
import type { GroupTable, Match, Team } from "@/types/domain";

async function readTeamsFromCache(includePayload: boolean): Promise<Team[]> {
  const payloadColumn = includePayload ? ", payload" : "";
  const { rows } = await query<Team>(
    `SELECT external_id, fifa_code, iso2, name, flag_url${payloadColumn}
     FROM teams_cache
     ORDER BY name`
  );

  return rows.map(localizeTeam).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

const getTeamsCached = unstable_cache(
  async () => readTeamsFromCache(false),
  ["teams-cache"],
  { revalidate: PAGE_CACHE_SECONDS, tags: ["teams"] }
);

const getTeamsWithPayloadCached = unstable_cache(
  async () => readTeamsFromCache(true),
  ["teams-cache-with-payload"],
  { revalidate: PAGE_CACHE_SECONDS, tags: ["teams"] }
);

async function readMatchesFromCache(): Promise<Match[]> {
  const { rows } = await query<Match>(
    `SELECT external_id, tournament_code, home_team_id, away_team_id, starts_at,
            stage, group_name, status, score_home, score_away,
            winner_team_id, decided_by, payload
     FROM matches_cache
     WHERE tournament_code = $1
     ORDER BY starts_at, external_id`,
    [TOURNAMENT_CODE]
  );

  const teams = await getTeamsCached();
  const byId = new Map(teams.map((team) => [team.external_id, team]));

  return rows.map((match) => ({
    ...match,
    home_team: match.home_team_id ? byId.get(match.home_team_id) ?? null : null,
    away_team: match.away_team_id ? byId.get(match.away_team_id) ?? null : null
  }));
}

const getMatchesCached = unstable_cache(
  async () => readMatchesFromCache(),
  ["matches-cache", TOURNAMENT_CODE],
  { revalidate: PAGE_CACHE_SECONDS, tags: ["matches"] }
);

export const listTeams = cache(async (): Promise<Team[]> => getTeamsCached());

export async function listTeamsForScoring(): Promise<Team[]> {
  return getTeamsWithPayloadCached();
}

export async function listMatches(options?: {
  refreshIfStale?: boolean;
}): Promise<Match[]> {
  if (options?.refreshIfStale) {
    await ensureWorldCupData().catch(() => undefined);
  }

  return getMatchesCached();
}

export const listMatchesCached = cache(() => getMatchesCached());

/** Leitura direta do banco — para polling de placar ao vivo (sem cache de 45s). */
export async function listMatchesLive(): Promise<Match[]> {
  return readMatchesFromCache();
}

export async function findMatch(matchId: string): Promise<Match | null> {
  const matches = await listMatchesLive();
  return matches.find((match) => match.external_id === matchId) ?? null;
}

function sortStandings(
  a: { pts: number; gd: number; gf: number; team: Team | null },
  b: { pts: number; gd: number; gf: number; team: Team | null }
) {
  return (
    b.pts - a.pts ||
    b.gd - a.gd ||
    b.gf - a.gf ||
    (a.team?.name ?? "").localeCompare(b.team?.name ?? "", "pt-BR")
  );
}

export async function listGroupStandings(): Promise<GroupTable[]> {
  const { rows } = await query<{
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
  }>(
    `SELECT group_name, team_id, position, mp, w, d, l, pts, gf, ga, gd
     FROM groups_cache
     WHERE tournament_code = $1
     ORDER BY group_name, position`,
    [TOURNAMENT_CODE]
  );

  const teams = await listTeams();
  const teamsById = new Map(teams.map((team) => [team.external_id, team]));
  const byGroup = new Map<string, GroupTable["standings"]>();

  for (const row of rows) {
    const standings = byGroup.get(row.group_name) ?? [];
    standings.push({
      team: teamsById.get(row.team_id) ?? null,
      mp: row.mp,
      w: row.w,
      d: row.d,
      l: row.l,
      pts: row.pts,
      gf: row.gf,
      ga: row.ga,
      gd: row.gd
    });
    byGroup.set(row.group_name, standings);
  }

  return [...byGroup.entries()]
    .map(([group, standings]) => ({
      group,
      standings: [...standings].sort(sortStandings)
    }))
    .sort((a, b) => a.group.localeCompare(b.group));
}

export async function getLatestSyncLog() {
  const { rows } = await query<{
    provider: string;
    status: string;
    message: string | null;
    created_at: string;
  }>(
    `SELECT provider, status, message, created_at
     FROM sync_logs
     WHERE provider = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [getWorldCupProvider()]
  );

  return rows[0] ?? null;
}
