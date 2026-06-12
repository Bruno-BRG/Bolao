import { TOURNAMENT_CODE } from "@/lib/constants";
import { isMatchFinished, isMatchLive } from "@/lib/match-status";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export type AdminMatchUpdate = {
  externalId: string;
  status: string;
  scoreHome: number | null;
  scoreAway: number | null;
  startsAt?: string;
};

function buildPayloadPatch(
  current: Record<string, unknown>,
  input: Pick<AdminMatchUpdate, "status" | "scoreHome" | "scoreAway">
) {
  const status = input.status.toUpperCase();
  const finished = isMatchFinished({ status });
  const live = isMatchLive({ status });
  const homeScore = input.scoreHome ?? 0;
  const awayScore = input.scoreAway ?? 0;

  let timeElapsed = "notstarted";
  if (live) {
    const currentElapsed = current.time_elapsed;
    timeElapsed =
      typeof currentElapsed === "string" && currentElapsed !== "notstarted"
        ? currentElapsed
        : "live";
  } else if (finished) {
    timeElapsed = "finished";
  }

  return {
    ...current,
    home_score: String(homeScore),
    away_score: String(awayScore),
    finished: finished ? "TRUE" : "FALSE",
    time_elapsed: timeElapsed
  };
}

export async function updateMatchFromAdmin(input: AdminMatchUpdate) {
  const supabase = getSupabaseAdmin();
  const { data: current, error: readError } = await supabase
    .from("matches_cache")
    .select("payload, starts_at")
    .eq("external_id", input.externalId)
    .eq("tournament_code", TOURNAMENT_CODE)
    .maybeSingle();

  if (readError) throw readError;
  if (!current) throw new Error("Jogo nao encontrado.");

  const status = input.status.toUpperCase();
  const payload = buildPayloadPatch(
    (current.payload ?? {}) as Record<string, unknown>,
    input
  );

  const { error } = await supabase
    .from("matches_cache")
    .update({
      status,
      score_home: input.scoreHome,
      score_away: input.scoreAway,
      starts_at: input.startsAt ?? current.starts_at,
      payload,
      updated_at: new Date().toISOString()
    })
    .eq("external_id", input.externalId)
    .eq("tournament_code", TOURNAMENT_CODE);

  if (error) throw error;
}
