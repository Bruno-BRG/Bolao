import { TOURNAMENT_CODE } from "@/lib/constants";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getTeamDisplayName } from "@/lib/team-names-pt";

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

type WorldCup26GameLike = Pick<WorldCup26Game, "local_date" | "stadium_id">;

type WrappedResponse<T> = {
  games?: T[];
  teams?: T[];
};

const WORLDCUP26_API_BASE_URL =
  process.env.WORLDCUP26_API_BASE_URL ?? "https://worldcup26.ir";
const WORLDCUP26_GITHUB_BASE_URL =
  process.env.WORLDCUP26_GITHUB_BASE_URL ??
  "https://raw.githubusercontent.com/rezarahiminia/worldcup2026/main";

const STADIUM_TIMEZONES: Record<string, string> = {
  "1": "America/Mexico_City",
  "2": "America/Mexico_City",
  "3": "America/Monterrey",
  "4": "America/Chicago",
  "5": "America/Chicago",
  "6": "America/Chicago",
  "7": "America/New_York",
  "8": "America/New_York",
  "9": "America/New_York",
  "10": "America/New_York",
  "11": "America/New_York",
  "12": "America/Toronto",
  "13": "America/Vancouver",
  "14": "America/Los_Angeles",
  "15": "America/Los_Angeles",
  "16": "America/Los_Angeles"
};

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

function getTimeZoneOffsetMilliseconds(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  const zonedAsUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  );

  return zonedAsUtc - date.getTime();
}

export function normalizeWorldCup26Kickoff(value: string, stadiumId: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/);
  if (!match) {
    throw new Error(`Invalid worldcup26 local_date format: ${value}`);
  }

  const [, month, day, year, hour, minute] = match;
  const timeZone = STADIUM_TIMEZONES[stadiumId];
  if (!timeZone) {
    throw new Error(`Missing timezone mapping for stadium ${stadiumId}`);
  }

  const utcGuess = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute))
  );
  const offset = getTimeZoneOffsetMilliseconds(utcGuess, timeZone);
  return new Date(utcGuess.getTime() - offset).toISOString();
}

export function hasWorldCup26TimezoneDrift(
  startsAt: string,
  payload: unknown
): boolean {
  if (!payload || typeof payload !== "object") return false;

  const game = payload as Partial<WorldCup26GameLike>;
  if (typeof game.local_date !== "string" || typeof game.stadium_id !== "string") {
    return false;
  }

  try {
    return normalizeWorldCup26Kickoff(game.local_date, game.stadium_id) !== startsAt;
  } catch {
    return false;
  }
}

export function mapWorldCup26Stage(type: string, group: string) {
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

export function mapWorldCup26Status(game: Pick<WorldCup26Game, "finished" | "time_elapsed">) {
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
    name: getTeamDisplayName({
      name: team.name_en,
      iso2: team.iso2?.toLowerCase?.() ?? null,
      fifa_code: team.fifa_code ?? null
    }),
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
    const status = mapWorldCup26Status(game);
    const hasCurrentScore = finished || status === "LIVE";
    const homeTeamId = game.home_team_id === "0" ? null : game.home_team_id;
    const awayTeamId = game.away_team_id === "0" ? null : game.away_team_id;

    return {
      external_id: game.id,
      tournament_code: TOURNAMENT_CODE,
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      starts_at: normalizeWorldCup26Kickoff(game.local_date, game.stadium_id),
      stage: mapWorldCup26Stage(game.type, game.group),
      group_name: game.type === "group" ? `Grupo ${game.group}` : null,
      status,
      score_home: parseScore(game.home_score, hasCurrentScore),
      score_away: parseScore(game.away_score, hasCurrentScore),
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
