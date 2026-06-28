import type { DecisionMethod } from "@/lib/decision-method";
import { isDecisionMethod } from "@/lib/decision-method";
import { isKnockoutStage } from "@/lib/knockout-stages";
import { isMatchFinished } from "@/lib/match-status";
import type { Match } from "@/types/domain";

export function isKnockoutMatch(match: Match) {
  return isKnockoutStage(match.stage);
}

export function getMatchWinnerTeamId(match: Match): string | null {
  if (match.winner_team_id) return match.winner_team_id;

  if (!isMatchFinished(match)) return null;
  if (match.score_home == null || match.score_away == null) return null;
  if (match.score_home > match.score_away) return match.home_team_id;
  if (match.score_away > match.score_home) return match.away_team_id;

  return null;
}

export function getMatchDecidedBy(match: Match): DecisionMethod | null {
  if (isDecisionMethod(match.decided_by)) return match.decided_by;

  const status = String(match.status).toUpperCase();
  if (status === "PEN" || status === "PENALTIES") return "PENALTIES";
  if (status === "AET" || status === "ET") return "EXTRA_TIME";
  if (isMatchFinished(match)) return "REGULAR";

  return null;
}

export function inferWinnerFromFinishedKnockout(match: Match): string | null {
  const winner = getMatchWinnerTeamId(match);
  if (winner) return winner;

  if (
    isMatchFinished(match) &&
    match.score_home != null &&
    match.score_away != null &&
    match.score_home === match.score_away
  ) {
    return match.winner_team_id ?? null;
  }

  return null;
}
