import { TOURNAMENT_CODE } from "@/lib/constants";
import { isMatchFinished, isMatchLive } from "@/lib/match-status";
import { query } from "@/lib/db";

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
  const { rows } = await query<{ payload: Record<string, unknown>; starts_at: string }>(
    `SELECT payload, starts_at
     FROM matches_cache
     WHERE external_id = $1 AND tournament_code = $2
     LIMIT 1`,
    [input.externalId, TOURNAMENT_CODE]
  );

  const current = rows[0];
  if (!current) throw new Error("Jogo nao encontrado.");

  const status = input.status.toUpperCase();
  const payload = buildPayloadPatch(current.payload ?? {}, input);

  await query(
    `UPDATE matches_cache
     SET status = $1,
         score_home = $2,
         score_away = $3,
         starts_at = $4,
         payload = $5,
         updated_at = NOW()
     WHERE external_id = $6 AND tournament_code = $7`,
    [
      status,
      input.scoreHome,
      input.scoreAway,
      input.startsAt ?? current.starts_at,
      payload,
      input.externalId,
      TOURNAMENT_CODE
    ]
  );
}
