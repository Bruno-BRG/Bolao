import { TOURNAMENT_CODE } from "@/lib/constants";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { localizeTeam } from "@/lib/team-names-pt";
import {
  ensureWorldCupData,
  getWorldCupProvider
} from "@/services/worldcup-sync.service";
import type { GroupTable, Match, Team } from "@/types/domain";

export async function listTeams(): Promise<Team[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("teams_cache")
    .select("external_id, fifa_code, iso2, name, flag_url, payload")
    .order("name");

  if (error) throw error;

  return ((data ?? []) as Team[])
    .map(localizeTeam)
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export async function listMatches(options?: {
  /** Sync from API only when cache is empty or stale (default: true). */
  refreshIfStale?: boolean;
}): Promise<Match[]> {
  if (options?.refreshIfStale !== false) {
    await ensureWorldCupData().catch(() => undefined);
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("matches_cache")
    .select(
      "external_id, tournament_code, home_team_id, away_team_id, starts_at, stage, group_name, status, score_home, score_away, payload"
    )
    .eq("tournament_code", TOURNAMENT_CODE)
    .order("starts_at")
    .order("external_id");

  if (error) throw error;

  const matches = (data ?? []) as Match[];
  const teams = await listTeams();
  const byId = new Map(teams.map((team) => [team.external_id, team]));

  return matches.map((match) => ({
    ...match,
    home_team: match.home_team_id ? byId.get(match.home_team_id) ?? null : null,
    away_team: match.away_team_id ? byId.get(match.away_team_id) ?? null : null
  }));
}

export async function findMatch(matchId: string): Promise<Match | null> {
  const matches = await listMatches({ refreshIfStale: false });
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
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("groups_cache")
    .select(
      "group_name, team_id, position, mp, w, d, l, pts, gf, ga, gd"
    )
    .eq("tournament_code", TOURNAMENT_CODE)
    .order("group_name")
    .order("position");

  if (error) throw error;

  const teams = await listTeams();
  const teamsById = new Map(teams.map((team) => [team.external_id, team]));
  const byGroup = new Map<string, GroupTable["standings"]>();

  for (const row of data ?? []) {
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
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("sync_logs")
    .select("provider, status, message, created_at")
    .eq("provider", getWorldCupProvider())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}
