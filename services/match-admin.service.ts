import { TOURNAMENT_CODE } from "@/lib/constants";
import { isMatchFinished, isMatchLive } from "@/lib/match-status";
import { query } from "@/lib/db";

export type AdminMatchUpdate = {
  externalId: string;
  status: string;
  scoreHome: number | null;
  scoreAway: number | null;
  startsAt?: string;
  homeTeamId?: string | null;
  awayTeamId?: string | null;
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
  } as Record<string, unknown>;
}

export type AdminMatchCreate = AdminMatchUpdate & {
  stage: string;
  groupName?: string | null;
  homeTeamId?: string | null;
  awayTeamId?: string | null;
};

function normalizeTeamId(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === "0") return null;
  return trimmed;
}

export async function createMatchFromAdmin(input: AdminMatchCreate) {
  const { rows } = await query<{ external_id: string }>(
    `SELECT external_id
     FROM matches_cache
     WHERE external_id = $1
     LIMIT 1`,
    [input.externalId]
  );

  if (rows[0]) {
    throw new Error("Ja existe um jogo com esse ID.");
  }

  const status = input.status.toUpperCase();
  const payload = buildPayloadPatch({}, input);
  const startsAt = input.startsAt;
  if (!startsAt) throw new Error("Informe data e hora do jogo.");

  await query(
    `INSERT INTO matches_cache (
       external_id, tournament_code, home_team_id, away_team_id, starts_at,
       stage, group_name, status, score_home, score_away, payload, updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
    [
      input.externalId,
      TOURNAMENT_CODE,
      normalizeTeamId(input.homeTeamId),
      normalizeTeamId(input.awayTeamId),
      startsAt,
      input.stage,
      input.groupName ?? null,
      status,
      input.scoreHome,
      input.scoreAway,
      payload
    ]
  );
}

export async function updateMatchFromAdmin(input: AdminMatchUpdate) {
  const { rows } = await query<{
    payload: Record<string, unknown>;
    starts_at: string;
    home_team_id: string | null;
    away_team_id: string | null;
  }>(
    `SELECT payload, starts_at, home_team_id, away_team_id
     FROM matches_cache
     WHERE external_id = $1 AND tournament_code = $2
     LIMIT 1`,
    [input.externalId, TOURNAMENT_CODE]
  );

  const current = rows[0];
  if (!current) throw new Error("Jogo nao encontrado.");

  const status = input.status.toUpperCase();
  const payload = buildPayloadPatch(current.payload ?? {}, input);
  const homeTeamId =
    input.homeTeamId !== undefined
      ? normalizeTeamId(input.homeTeamId)
      : current.home_team_id;
  const awayTeamId =
    input.awayTeamId !== undefined
      ? normalizeTeamId(input.awayTeamId)
      : current.away_team_id;

  if (homeTeamId) {
    const { rows: homeRows } = await query<{ name: string }>(
      `SELECT name FROM teams_cache WHERE external_id = $1 LIMIT 1`,
      [homeTeamId]
    );
    if (homeRows[0]?.name) {
      payload.home_team_name_en = homeRows[0].name;
      payload.home_team_label = homeRows[0].name;
    }
  }

  if (awayTeamId) {
    const { rows: awayRows } = await query<{ name: string }>(
      `SELECT name FROM teams_cache WHERE external_id = $1 LIMIT 1`,
      [awayTeamId]
    );
    if (awayRows[0]?.name) {
      payload.away_team_name_en = awayRows[0].name;
      payload.away_team_label = awayRows[0].name;
    }
  }

  await query(
    `UPDATE matches_cache
     SET status = $1,
         score_home = $2,
         score_away = $3,
         starts_at = $4,
         home_team_id = $5,
         away_team_id = $6,
         payload = $7,
         updated_at = NOW()
     WHERE external_id = $8 AND tournament_code = $9`,
    [
      status,
      input.scoreHome,
      input.scoreAway,
      input.startsAt ?? current.starts_at,
      homeTeamId,
      awayTeamId,
      payload,
      input.externalId,
      TOURNAMENT_CODE
    ]
  );
}
