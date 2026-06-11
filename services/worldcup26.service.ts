import { TOURNAMENT_CODE } from "@/lib/constants";
import { getSupabaseAdmin } from "@/lib/supabase-server";

type WorldCup26Team = {
  fifa_code: string;
  flag: string;
  groups: string;
  id: string;
  iso2: string;
  name_en: string;
  name_fa?: string;
};

type WorldCup26Game = {
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

type WrappedResponse<T> = {
  games?: T[];
  teams?: T[];
};

const WORLDCUP26_API_BASE_URL =
  process.env.WORLDCUP26_API_BASE_URL ?? "https://worldcup26.ir";
const WORLDCUP26_GITHUB_BASE_URL =
  process.env.WORLDCUP26_GITHUB_BASE_URL ??
  "https://raw.githubusercontent.com/rezarahiminia/worldcup2026/main";

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { next: { revalidate: 0 } });
  if (!response.ok) {
    throw new Error(`worldcup26 source failed with ${response.status} for ${url}`);
  }

  return (await response.json()) as T;
}

async function fetchTeams(): Promise<WorldCup26Team[]> {
  try {
    const payload = await fetchJson<WrappedResponse<WorldCup26Team>>(
      `${WORLDCUP26_API_BASE_URL}/get/teams`
    );
    if (payload.teams && payload.teams.length > 0) return payload.teams;
  } catch {
    // Fallback handled below.
  }

  return fetchJson<WorldCup26Team[]>(`${WORLDCUP26_GITHUB_BASE_URL}/football.teams.json`);
}

async function fetchGames(): Promise<WorldCup26Game[]> {
  try {
    const payload = await fetchJson<WrappedResponse<WorldCup26Game>>(
      `${WORLDCUP26_API_BASE_URL}/get/games`
    );
    if (payload.games && payload.games.length > 0) return payload.games;
  } catch {
    // Fallback handled below.
  }

  return fetchJson<WorldCup26Game[]>(`${WORLDCUP26_GITHUB_BASE_URL}/football.matches.json`);
}

function parseLocalDate(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/);
  if (!match) {
    throw new Error(`Invalid worldcup26 local_date format: ${value}`);
  }

  const [, month, day, year, hour, minute] = match;
  return new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute))
  ).toISOString();
}

function mapStage(type: string, group: string) {
  switch (type) {
    case "group":
      return "Grupos";
    case "r32":
      return "32 avos";
    case "r16":
      return "Oitavas";
    case "qf":
      return "Quartas";
    case "sf":
      return "Semifinal";
    case "third":
      return "Terceiro lugar";
    case "final":
      return "Final";
    default:
      return group || type;
  }
}

function mapStatus(game: WorldCup26Game) {
  if (game.finished === "TRUE") return "FINISHED";
  if (game.time_elapsed && game.time_elapsed !== "notstarted") return "LIVE";
  return "SCHEDULED";
}

function parseScore(value: string, finished: boolean) {
  if (!finished) return null;
  const score = Number(value);
  return Number.isFinite(score) ? score : null;
}

export async function syncWorldCupFromWorldCup26() {
  const [teamsResponse, gamesResponse] = await Promise.all([fetchTeams(), fetchGames()]);
  const supabase = getSupabaseAdmin();

  const { error: deleteMatchesError } = await supabase
    .from("matches_cache")
    .delete()
    .eq("tournament_code", TOURNAMENT_CODE);
  if (deleteMatchesError) throw deleteMatchesError;

  const teams = teamsResponse.map((team) => ({
    external_id: team.id,
    fifa_code: team.fifa_code ?? null,
    iso2: team.iso2?.toLowerCase?.() ?? null,
    name: team.name_en,
    flag_url: team.flag ?? null,
    payload: team,
    updated_at: new Date().toISOString()
  }));

  const syncedTeamIds = teams.map((team) => team.external_id);
  if (teams.length > 0) {
    const { error } = await supabase.from("teams_cache").upsert(teams, {
      onConflict: "external_id"
    });
    if (error) throw error;

    const syncedTeamFilter = `(${syncedTeamIds.map((id) => `"${id}"`).join(",")})`;
    const { error: pruneTeamsError } = await supabase
      .from("teams_cache")
      .delete()
      .not("external_id", "in", syncedTeamFilter);
    if (pruneTeamsError) throw pruneTeamsError;
  }

  const matches = gamesResponse.map((game) => {
    const finished = game.finished === "TRUE";
    const homeTeamId = game.home_team_id === "0" ? null : game.home_team_id;
    const awayTeamId = game.away_team_id === "0" ? null : game.away_team_id;

    return {
      external_id: game.id,
      tournament_code: TOURNAMENT_CODE,
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      starts_at: parseLocalDate(game.local_date),
      stage: mapStage(game.type, game.group),
      group_name: game.type === "group" ? `Grupo ${game.group}` : null,
      status: mapStatus(game),
      score_home: parseScore(game.home_score, finished),
      score_away: parseScore(game.away_score, finished),
      payload: game,
      updated_at: new Date().toISOString()
    };
  });

  if (matches.length > 0) {
    const { error } = await supabase.from("matches_cache").upsert(matches, {
      onConflict: "external_id"
    });
    if (error) throw error;
  }

  await supabase.from("sync_logs").insert({
    provider: "worldcup26",
    status: "success",
    message: `Synced ${teams.length} teams and ${matches.length} fixtures.`,
    payload: {
      source: WORLDCUP26_API_BASE_URL
    }
  });

  return {
    teams: teams.length,
    fixtures: matches.length
  };
}
