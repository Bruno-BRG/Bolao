import { TOURNAMENT_CODE } from "@/lib/constants";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import {
  ensureWorldCupData,
  getWorldCupProvider
} from "@/services/worldcup-sync.service";
import type { Match, Team } from "@/types/domain";

export async function listTeams(): Promise<Team[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("teams_cache")
    .select("external_id, fifa_code, iso2, name, flag_url, payload")
    .order("name");

  if (error) throw error;
  return (data ?? []) as Team[];
}

export async function listMatches(options?: {
  autoSyncIfEmpty?: boolean;
}): Promise<Match[]> {
  if (options?.autoSyncIfEmpty !== false) {
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
  const matches = await listMatches({ autoSyncIfEmpty: false });
  return matches.find((match) => match.external_id === matchId) ?? null;
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
