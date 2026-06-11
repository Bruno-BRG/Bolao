import { TOURNAMENT_CODE } from "@/lib/constants";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { getTeamDisplayName } from "@/lib/team-names-pt";

type ApiFootballResponse<T> = {
  errors?: Record<string, string>;
  response: T[];
  results?: number;
};

type ApiFootballTeamResponse = {
  team: {
    id: number;
    code: string | null;
    country: string | null;
    logo: string | null;
    name: string;
  };
};

type ApiFootballFixtureResponse = {
  fixture: {
    date: string;
    id: number;
    status: {
      long: string;
      short: string;
    };
  };
  league: {
    name: string;
    round: string | null;
  };
  score: {
    fulltime: {
      away: number | null;
      home: number | null;
    };
  };
  teams: {
    away: {
      id: number;
      name: string;
    };
    home: {
      id: number;
      name: string;
    };
  };
};

const API_FOOTBALL_BASE_URL =
  process.env.API_FOOTBALL_BASE_URL ?? "https://v3.football.api-sports.io";
const API_FOOTBALL_LEAGUE_ID = Number(process.env.API_FOOTBALL_LEAGUE_ID ?? "1");
const API_FOOTBALL_SEASON = Number(process.env.API_FOOTBALL_SEASON ?? "2026");
const AUTO_SYNC_MAX_AGE_MINUTES = Number(
  process.env.AUTO_SYNC_MAX_AGE_MINUTES ?? "360"
);

function getApiFootballKey() {
  const key = process.env.FOOTBALL_API_KEY;
  if (!key) {
    throw new Error("Missing FOOTBALL_API_KEY for API-Football sync.");
  }
  return key;
}

async function apiFootballGet<T>(
  path: string,
  query: Record<string, string | number>
): Promise<T[]> {
  const key = getApiFootballKey();
  const url = new URL(path, API_FOOTBALL_BASE_URL);

  for (const [field, value] of Object.entries(query)) {
    url.searchParams.set(field, String(value));
  }

  const response = await fetch(url, {
    headers: {
      "x-apisports-key": key
    },
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    throw new Error(`API-Football request failed with ${response.status}.`);
  }

  const payload = (await response.json()) as ApiFootballResponse<T>;
  if (payload.errors && Object.keys(payload.errors).length > 0) {
    throw new Error(`API-Football error: ${JSON.stringify(payload.errors)}`);
  }

  return payload.response ?? [];
}

function normalizeIso2(country: string | null) {
  if (!country) return null;

  const manualMap: Record<string, string> = {
    Argentina: "ar",
    Brazil: "br",
    Canada: "ca",
    England: "gb-eng",
    France: "fr",
    Germany: "de",
    Japan: "jp",
    Mexico: "mx",
    Morocco: "ma",
    Netherlands: "nl",
    Portugal: "pt",
    "South Korea": "kr",
    Spain: "es",
    "United States": "us",
    Uruguay: "uy"
  };

  return manualMap[country] ?? null;
}

function extractGroupName(round: string | null) {
  if (!round) return null;
  const groupMatch = round.match(/Group\s+([A-Z0-9]+)/i);
  return groupMatch ? `Grupo ${groupMatch[1].toUpperCase()}` : null;
}

function translateStage(round: string | null) {
  if (!round) return "Fase";

  const normalized = round.toLowerCase();
  if (normalized.includes("group")) return "Grupos";
  if (normalized.includes("round of 32")) return "32 avos";
  if (normalized.includes("round of 16")) return "Oitavas";
  if (normalized.includes("quarter")) return "Quartas";
  if (normalized.includes("semi")) return "Semifinal";
  if (normalized.includes("final")) return "Final";
  if (normalized.includes("3rd") || normalized.includes("third")) return "Terceiro lugar";
  return round;
}

function mapStatus(shortStatus: string) {
  const status = shortStatus.toUpperCase();

  if (["NS", "TBD", "PST"].includes(status)) return "SCHEDULED";
  if (["1H", "HT", "2H", "ET", "BT", "P", "LIVE", "INT"].includes(status)) {
    return "LIVE";
  }
  if (["FT", "AET", "PEN"].includes(status)) return "FINISHED";
  if (["CANC", "ABD", "AWD", "WO"].includes(status)) return "CANCELLED";
  return status;
}

export async function syncWorldCupFromApiFootball() {
  const [teamsResponse, fixturesResponse] = await Promise.all([
    apiFootballGet<ApiFootballTeamResponse>("teams", {
      league: API_FOOTBALL_LEAGUE_ID,
      season: API_FOOTBALL_SEASON
    }),
    apiFootballGet<ApiFootballFixtureResponse>("fixtures", {
      league: API_FOOTBALL_LEAGUE_ID,
      season: API_FOOTBALL_SEASON
    })
  ]);

  const supabase = getSupabaseAdmin();
  const syncedTeamIds = teamsResponse.map(({ team }) => String(team.id));

  const teams = teamsResponse.map(({ team }) => ({
    external_id: String(team.id),
    fifa_code: team.code,
    iso2: normalizeIso2(team.country),
    name: getTeamDisplayName({
      name: team.name,
      iso2: normalizeIso2(team.country),
      fifa_code: team.code
    }),
    flag_url: team.logo,
    payload: team,
    updated_at: new Date().toISOString()
  }));

  if (teams.length > 0) {
    const syncedTeamFilter = `(${syncedTeamIds.map((id) => `"${id}"`).join(",")})`;

    const { error } = await supabase.from("teams_cache").upsert(teams, {
      onConflict: "external_id"
    });
    if (error) throw error;

    const { error: pruneTeamsError } = await supabase
      .from("teams_cache")
      .delete()
      .not("external_id", "in", syncedTeamFilter);
    if (pruneTeamsError) throw pruneTeamsError;
  }

  const matches = fixturesResponse.map(({ fixture, league, score, teams: fixtureTeams }) => ({
    external_id: String(fixture.id),
    tournament_code: TOURNAMENT_CODE,
    home_team_id: String(fixtureTeams.home.id),
    away_team_id: String(fixtureTeams.away.id),
    starts_at: fixture.date,
    stage: translateStage(league.round),
    group_name: extractGroupName(league.round),
    status: mapStatus(fixture.status.short),
    score_home: score.fulltime.home,
    score_away: score.fulltime.away,
    payload: {
      fixture,
      league,
      score,
      teams: fixtureTeams
    },
    updated_at: new Date().toISOString()
  }));

  if (matches.length > 0) {
    const { error } = await supabase.from("matches_cache").upsert(matches, {
      onConflict: "external_id"
    });
    if (error) throw error;
  }

  await supabase.from("sync_logs").insert({
    provider: "api-football",
    status: "success",
    message: `Synced ${teams.length} teams and ${matches.length} fixtures.`,
    payload: {
      league: API_FOOTBALL_LEAGUE_ID,
      season: API_FOOTBALL_SEASON
    }
  });

  return {
    teams: teams.length,
    fixtures: matches.length
  };
}

export async function ensureWorldCupData(options?: { force?: boolean }) {
  if (!process.env.FOOTBALL_API_KEY) {
    return { ran: false, reason: "missing-key" as const };
  }

  const supabase = getSupabaseAdmin();
  const now = Date.now();
  const staleThreshold = new Date(
    now - AUTO_SYNC_MAX_AGE_MINUTES * 60 * 1000
  ).toISOString();

  const [{ count: matchesCount, error: countError }, { data: latestSync, error: syncError }] =
    await Promise.all([
      supabase
        .from("matches_cache")
        .select("external_id", { count: "exact", head: true })
        .eq("tournament_code", TOURNAMENT_CODE),
      supabase
        .from("sync_logs")
        .select("created_at, status")
        .eq("provider", "api-football")
        .eq("status", "success")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    ]);

  if (countError) throw countError;
  if (syncError) throw syncError;

  const shouldSyncBecauseEmpty = (matchesCount ?? 0) === 0;
  const shouldSyncBecauseStale =
    !latestSync || latestSync.created_at < staleThreshold;

  if (!options?.force && !shouldSyncBecauseEmpty && !shouldSyncBecauseStale) {
    return { ran: false, reason: "fresh" as const };
  }

  try {
    const syncResult = await syncWorldCupFromApiFootball();
    return {
      ran: true,
      reason: shouldSyncBecauseEmpty ? ("empty" as const) : ("stale" as const),
      syncResult
    };
  } catch (error) {
    await supabase.from("sync_logs").insert({
      provider: "api-football",
      status: "error",
      message: (error as Error).message,
      payload: {
        league: API_FOOTBALL_LEAGUE_ID,
        season: API_FOOTBALL_SEASON,
        auto: true
      }
    });

    return {
      ran: false,
      reason: "error" as const,
      error: (error as Error).message
    };
  }
}
