import type { Match } from "@/types/domain";
import { getTeamDisplayName, localizeTeamName } from "@/lib/team-names-pt";

const PLACEHOLDER_LABEL =
  /winner|runner|runner-up|runners-up|loser|defeated|2nd|3rd|group\s+[a-z0-9]|^[a-z]$/i;

export function getMatchTeamLabel(match: Match, side: "home" | "away") {
  const payload = match.payload ?? {};
  const team = side === "home" ? match.home_team : match.away_team;
  const labelKey = side === "home" ? "home_team_label" : "away_team_label";
  const fallback = typeof payload[labelKey] === "string" ? payload[labelKey] : null;
  if (team) return getTeamDisplayName(team);

  const englishNameKey = side === "home" ? "home_team_name_en" : "away_team_name_en";
  const englishName =
    typeof payload[englishNameKey] === "string" ? payload[englishNameKey] : null;

  return (
    (englishName ? localizeTeamName(englishName) : null) ??
    (fallback ? localizeTeamName(fallback) : null) ??
    "A definir"
  );
}

function isPlaceholderSide(match: Match, side: "home" | "away") {
  const teamId = side === "home" ? match.home_team_id : match.away_team_id;
  if (!teamId) return true;

  const payload = match.payload ?? {};
  const labelKey = side === "home" ? "home_team_label" : "away_team_label";
  const label = typeof payload[labelKey] === "string" ? payload[labelKey] : "";
  if (label && PLACEHOLDER_LABEL.test(label)) return true;

  const team = side === "home" ? match.home_team : match.away_team;
  if (!team) return true;

  return false;
}

export function isMatchPredictable(match: Match) {
  return !isPlaceholderSide(match, "home") && !isPlaceholderSide(match, "away");
}

export function shouldShowMatchInPalpites(
  match: Match,
  savedMatchIds: Set<string>
) {
  if (isMatchPredictable(match)) return true;
  return savedMatchIds.has(match.external_id);
}
