import type { Match } from "@/types/domain";
import { isKnockoutStage } from "@/lib/knockout-stages";
import { getTeamDisplayName, localizeTeamName } from "@/lib/team-names-pt";

const PLACEHOLDER_LABEL =
  /winner|runner|runner-up|runners-up|loser|defeated|2nd|3rd|group\s+[a-z0-9]|^[a-z]$/i;

export function getMatchTeamLabel(match: Match, side: "home" | "away") {
  const payload = match.payload ?? {};
  const labelKey = side === "home" ? "home_team_label" : "away_team_label";
  const slotLabel = typeof payload[labelKey] === "string" ? payload[labelKey] : null;

  // Keep placeholder slots visible until the group/match is really decided.
  if (slotLabel && PLACEHOLDER_LABEL.test(slotLabel)) {
    return localizeTeamName(slotLabel);
  }

  const team = side === "home" ? match.home_team : match.away_team;
  if (team) return getTeamDisplayName(team);

  const englishNameKey = side === "home" ? "home_team_name_en" : "away_team_name_en";
  const englishName =
    typeof payload[englishNameKey] === "string" ? payload[englishNameKey] : null;

  return (
    (englishName ? localizeTeamName(englishName) : null) ??
    (slotLabel ? localizeTeamName(slotLabel) : null) ??
    "A definir"
  );
}

function getPlaceholderLabel(match: Match, side: "home" | "away") {
  const payload = match.payload ?? {};
  const labelKey = side === "home" ? "home_team_label" : "away_team_label";
  const label = typeof payload[labelKey] === "string" ? payload[labelKey] : "";

  const englishNameKey = side === "home" ? "home_team_name_en" : "away_team_name_en";
  const englishName =
    typeof payload[englishNameKey] === "string" ? payload[englishNameKey] : "";

  const apiTeams = payload.teams as
    | { home?: { name?: string }; away?: { name?: string } }
    | undefined;
  const apiName = side === "home" ? apiTeams?.home?.name : apiTeams?.away?.name;

  return label || englishName || apiName || "";
}

function hasRealTeamId(teamId: string | null | undefined) {
  return Boolean(teamId && teamId !== "0");
}

function isPlaceholderSide(match: Match, side: "home" | "away") {
  const payload = match.payload ?? {};
  const labelKey = side === "home" ? "home_team_label" : "away_team_label";
  const slotLabel =
    typeof payload[labelKey] === "string" ? payload[labelKey] : "";

  if (slotLabel && PLACEHOLDER_LABEL.test(slotLabel)) {
    return true;
  }

  const teamId = side === "home" ? match.home_team_id : match.away_team_id;
  const team = side === "home" ? match.home_team : match.away_team;

  if (hasRealTeamId(teamId) && team) {
    return PLACEHOLDER_LABEL.test(team.name);
  }

  const englishName = getPlaceholderLabel(match, side);
  if (englishName && !PLACEHOLDER_LABEL.test(englishName)) {
    return false;
  }

  return !hasRealTeamId(teamId);
}

export function isMatchPredictable(match: Match) {
  return !isPlaceholderSide(match, "home") && !isPlaceholderSide(match, "away");
}

export function shouldShowMatchInPalpites(
  match: Match,
  savedMatchIds: Set<string>
) {
  if (isKnockoutStage(match.stage)) return true;
  if (isMatchPredictable(match)) return true;
  return savedMatchIds.has(match.external_id);
}
