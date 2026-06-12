import { FINISHED_STATUSES, LOCKED_STATUSES } from "@/lib/constants";
import type { Match } from "@/types/domain";

type DisplayOfficialScore = {
  away: number;
  home: number;
  label: string;
};

function parseScoreValue(value: unknown) {
  const score = Number(value);
  return Number.isFinite(score) ? score : null;
}

export function getDisplayOfficialScore(match: Match): DisplayOfficialScore | null {
  const status = match.status.toUpperCase();
  const payload = match.payload ?? {};
  const home =
    match.score_home ?? parseScoreValue(payload.home_score);
  const away =
    match.score_away ?? parseScoreValue(payload.away_score);

  if (home !== null && away !== null) {
    if (status === "LIVE") {
      return { home, away, label: "Ao vivo" };
    }
    if (LOCKED_STATUSES.has(status) || FINISHED_STATUSES.has(status)) {
      return {
        home,
        away,
        label: FINISHED_STATUSES.has(status) ? "Resultado oficial" : "Placar atual"
      };
    }
    if (status === "SCHEDULED") return null;
    return { home, away, label: "Placar atual" };
  }

  return null;
}
