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
  if (match.score_home !== null && match.score_away !== null) {
    return {
      home: match.score_home,
      away: match.score_away,
      label: FINISHED_STATUSES.has(match.status.toUpperCase()) ? "Resultado oficial" : "Placar atual"
    };
  }

  const payload = match.payload ?? {};
  const home = parseScoreValue(payload.home_score);
  const away = parseScoreValue(payload.away_score);
  const status = match.status.toUpperCase();

  if (home === null || away === null) return null;
  if (!LOCKED_STATUSES.has(status) && status !== "LIVE") return null;

  return {
    home,
    away,
    label: status === "LIVE" ? "Ao vivo" : "Resultado oficial"
  };
}
