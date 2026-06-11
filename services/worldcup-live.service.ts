import { FINISHED_STATUSES } from "@/lib/constants";
import { getTeamDisplayName } from "@/lib/team-names-pt";
import type { Match, Team } from "@/types/domain";
import {
  mapWorldCup26Stage,
  mapWorldCup26Status,
  normalizeWorldCup26Kickoff
} from "@/services/worldcup26.service";

type LiveTeamResponse = {
  fifa_code: string;
  flag: string;
  groups: string;
  id: string;
  iso2: string;
  name_en: string;
};

type LiveGameResponse = {
  away_score: string;
  away_team_id: string;
  away_team_label?: string;
  away_team_name_en?: string;
  finished: string;
  group: string;
  home_score: string;
  home_team_id: string;
  home_team_label?: string;
  home_team_name_en?: string;
  id: string;
  local_date: string;
  matchday: string;
  stadium_id: string;
  time_elapsed: string;
  type: string;
};

type LiveGroupResponse = {
  group?: string;
  name?: string;
  teams: Array<{
    team_id: string;
    mp: string;
    w: string;
    l: string;
    d: string;
    pts: string;
    gf: string;
    ga: string;
    gd: string;
  }>;
};

type LiveStadiumResponse = {
  id: string;
  name_en: string;
  fifa_name?: string;
  city_en?: string;
  country_en?: string;
};

type WrappedResponse<T, K extends string> = Record<K, T[]>;

export type LiveMatch = Match & {
  current_score_home: number | null;
  current_score_away: number | null;
  minute_label: string | null;
  venue_name: string | null;
  city_name: string | null;
  country_name: string | null;
  source_label: string;
};

export type LiveGroupStanding = {
  team: Team | null;
  mp: number;
  w: number;
  d: number;
  l: number;
  pts: number;
  gf: number;
  ga: number;
  gd: number;
};

export type LiveGroupTable = {
  group: string;
  standings: LiveGroupStanding[];
};

const WORLDCUP26_API_BASE_URL =
  process.env.WORLDCUP26_API_BASE_URL ?? "https://worldcup26.ir";
const WORLDCUP26_GITHUB_BASE_URL =
  process.env.WORLDCUP26_GITHUB_BASE_URL ??
  "https://raw.githubusercontent.com/rezarahiminia/worldcup2026/main";

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`worldcup live source failed with ${response.status} for ${url}`);
  }

  return (await response.json()) as T;
}

async function fetchCollection<T>(options: {
  apiUrl: string;
  apiKey: string;
  fallbackUrl: string;
}): Promise<T[]> {
  try {
    const payload = await fetchJson<WrappedResponse<T, typeof options.apiKey>>(options.apiUrl);
    const items = payload[options.apiKey];
    if (Array.isArray(items) && items.length > 0) return items;
  } catch {
    // Fallback handled below.
  }

  return fetchJson<T[]>(options.fallbackUrl);
}

function parseLiveScore(value: string, enabled: boolean) {
  if (!enabled) return null;
  const score = Number(value);
  return Number.isFinite(score) ? score : null;
}

function sortStandings(a: LiveGroupStanding, b: LiveGroupStanding) {
  return (
    b.pts - a.pts ||
    b.gd - a.gd ||
    b.gf - a.gf ||
    (a.team?.name ?? "").localeCompare(b.team?.name ?? "")
  );
}

export function getLiveFeedHighlights(matches: LiveMatch[]) {
  const now = Date.now();
  const live = matches.filter((match) => match.status === "LIVE");
  const latest = [...matches]
    .filter((match) => FINISHED_STATUSES.has(match.status))
    .sort(
      (a, b) =>
        new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime() ||
        b.external_id.localeCompare(a.external_id)
    )[0] ?? null;
  const next = [...matches]
    .filter(
      (match) =>
        new Date(match.starts_at).getTime() >= now && !FINISHED_STATUSES.has(match.status)
    )
    .sort(
      (a, b) =>
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime() ||
        a.external_id.localeCompare(b.external_id)
    )[0] ?? null;

  return {
    liveMatches: live,
    latestMatch: latest,
    nextMatch: next
  };
}

export async function getLiveWorldCupData() {
  const [teamsResponse, gamesResponse, groupsResponse, stadiumsResponse] = await Promise.all([
    fetchCollection<LiveTeamResponse>({
      apiUrl: `${WORLDCUP26_API_BASE_URL}/get/teams`,
      apiKey: "teams",
      fallbackUrl: `${WORLDCUP26_GITHUB_BASE_URL}/football.teams.json`
    }),
    fetchCollection<LiveGameResponse>({
      apiUrl: `${WORLDCUP26_API_BASE_URL}/get/games`,
      apiKey: "games",
      fallbackUrl: `${WORLDCUP26_GITHUB_BASE_URL}/football.matches.json`
    }),
    fetchCollection<LiveGroupResponse>({
      apiUrl: `${WORLDCUP26_API_BASE_URL}/get/groups`,
      apiKey: "groups",
      fallbackUrl: `${WORLDCUP26_GITHUB_BASE_URL}/worldcup2026.groups.json`
    }),
    fetchCollection<LiveStadiumResponse>({
      apiUrl: `${WORLDCUP26_API_BASE_URL}/get/stadiums`,
      apiKey: "stadiums",
      fallbackUrl: `${WORLDCUP26_GITHUB_BASE_URL}/football.stadiums.json`
    })
  ]);

  const teams: Team[] = teamsResponse.map((team) => ({
    external_id: team.id,
    fifa_code: team.fifa_code ?? null,
    iso2: team.iso2?.toLowerCase?.() ?? null,
    name: getTeamDisplayName({
      name: team.name_en,
      iso2: team.iso2?.toLowerCase?.() ?? null,
      fifa_code: team.fifa_code ?? null
    }),
    flag_url: team.flag ?? null,
    payload: team
  }));

  const teamsById = new Map(teams.map((team) => [team.external_id, team]));
  const stadiumsById = new Map(
    stadiumsResponse.map((stadium) => [stadium.id, stadium] as const)
  );

  const matches: LiveMatch[] = gamesResponse
    .map((game) => {
      const status = mapWorldCup26Status(game);
      const homeTeamId = game.home_team_id === "0" ? null : game.home_team_id;
      const awayTeamId = game.away_team_id === "0" ? null : game.away_team_id;
      const stadium = stadiumsById.get(game.stadium_id);
      const hasCurrentScore = status === "LIVE" || FINISHED_STATUSES.has(status);

      return {
        external_id: game.id,
        tournament_code: "WC2026",
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
        starts_at: normalizeWorldCup26Kickoff(game.local_date, game.stadium_id),
        stage: mapWorldCup26Stage(game.type, game.group),
        group_name: game.type === "group" ? `Grupo ${game.group}` : null,
        status,
        score_home: parseLiveScore(game.home_score, FINISHED_STATUSES.has(status)),
        score_away: parseLiveScore(game.away_score, FINISHED_STATUSES.has(status)),
        payload: game,
        home_team: homeTeamId ? teamsById.get(homeTeamId) ?? null : null,
        away_team: awayTeamId ? teamsById.get(awayTeamId) ?? null : null,
        current_score_home: parseLiveScore(game.home_score, hasCurrentScore),
        current_score_away: parseLiveScore(game.away_score, hasCurrentScore),
        minute_label:
          game.time_elapsed && game.time_elapsed !== "notstarted" ? game.time_elapsed : null,
        venue_name: stadium?.fifa_name ?? stadium?.name_en ?? null,
        city_name: stadium?.city_en ?? null,
        country_name: stadium?.country_en ?? null,
        source_label: "worldcup26.ir"
      };
    })
    .sort(
      (a, b) =>
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime() ||
        a.external_id.localeCompare(b.external_id)
    );

  const groups: LiveGroupTable[] = groupsResponse
    .map((group) => ({
      group: group.group ?? group.name ?? "?",
      standings: group.teams
        .map((row) => ({
          team: teamsById.get(row.team_id) ?? null,
          mp: Number(row.mp) || 0,
          w: Number(row.w) || 0,
          d: Number(row.d) || 0,
          l: Number(row.l) || 0,
          pts: Number(row.pts) || 0,
          gf: Number(row.gf) || 0,
          ga: Number(row.ga) || 0,
          gd: Number(row.gd) || 0
        }))
        .sort(sortStandings)
    }))
    .sort((a, b) => a.group.localeCompare(b.group));

  return {
    teams,
    matches,
    groups,
    source: {
      label: "worldcup26.ir",
      gamesUrl: `${WORLDCUP26_API_BASE_URL}/get/games`,
      groupsUrl: `${WORLDCUP26_API_BASE_URL}/get/groups`
    }
  };
}
