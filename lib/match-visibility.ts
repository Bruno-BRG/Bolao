import type { Match } from "@/types/domain";
import { isKnockoutStage } from "@/lib/knockout-stages";
import { getTeamDisplayName, localizeTeamName } from "@/lib/team-names-pt";

const PLACEHOLDER_LABEL =
  /winner|runner|runner-up|runners-up|loser|defeated|2nd|3rd|group\s+[a-z0-9]|^[a-z]$/i;

const WINNER_GROUP_RE = /^winner\s+group\s+([a-l])$/i;
const RUNNER_UP_GROUP_RE = /^runner(?:-|\s)?up\s+group\s+([a-l])$/i;
const WINNER_MATCH_RE = /^winner\s+match\s+(\d+)$/i;
const LOSER_MATCH_RE = /^loser\s+match\s+(\d+)$/i;
const THIRD_POOL_RE = /^3rd\s+group\s+(.+)$/i;

export function localizeKnockoutSlotLabel(label: string) {
  const normalized = label.trim().replace(/\s+/g, " ");

  const winnerGroup = normalized.match(WINNER_GROUP_RE);
  if (winnerGroup) return `1º do Grupo ${winnerGroup[1].toUpperCase()}`;

  const runnerUp = normalized.match(RUNNER_UP_GROUP_RE);
  if (runnerUp) return `2º do Grupo ${runnerUp[1].toUpperCase()}`;

  const winnerMatch = normalized.match(WINNER_MATCH_RE);
  if (winnerMatch) return `Vencedor do jogo ${winnerMatch[1]}`;

  const loserMatch = normalized.match(LOSER_MATCH_RE);
  if (loserMatch) return `Perdedor do jogo ${loserMatch[1]}`;

  const thirdPool = normalized.match(THIRD_POOL_RE);
  if (thirdPool) {
    const groups = thirdPool[1]
      .split("/")
      .map((group) => group.trim().toUpperCase())
      .join(", ");
    return `3º colocado (${groups})`;
  }

  return localizeTeamName(normalized);
}

function hasRealTeamId(teamId: string | null | undefined) {
  return Boolean(teamId && teamId !== "0");
}

function isResolvedTeamName(name: string | null | undefined) {
  return Boolean(name && name.trim() && !PLACEHOLDER_LABEL.test(name));
}

export function getMatchTeamLabel(match: Match, side: "home" | "away") {
  const payload = match.payload ?? {};
  const labelKey = side === "home" ? "home_team_label" : "away_team_label";
  const slotLabel = typeof payload[labelKey] === "string" ? payload[labelKey] : null;
  const teamId = side === "home" ? match.home_team_id : match.away_team_id;
  const team = side === "home" ? match.home_team : match.away_team;

  const englishNameKey = side === "home" ? "home_team_name_en" : "away_team_name_en";
  const englishName =
    typeof payload[englishNameKey] === "string" ? payload[englishNameKey] : null;

  if (hasRealTeamId(teamId)) {
    if (team && isResolvedTeamName(team.name)) {
      return getTeamDisplayName(team);
    }
    if (isResolvedTeamName(englishName)) {
      return localizeTeamName(englishName!);
    }
  }

  if (slotLabel && PLACEHOLDER_LABEL.test(slotLabel)) {
    return localizeKnockoutSlotLabel(slotLabel);
  }

  if (team) return getTeamDisplayName(team);

  return (
    (englishName ? localizeTeamName(englishName) : null) ??
    (slotLabel ? localizeKnockoutSlotLabel(slotLabel) : null) ??
    "A definir"
  );
}

function isPlaceholderSide(match: Match, side: "home" | "away") {
  const payload = match.payload ?? {};
  const labelKey = side === "home" ? "home_team_label" : "away_team_label";
  const slotLabel =
    typeof payload[labelKey] === "string" ? payload[labelKey] : "";

  const teamId = side === "home" ? match.home_team_id : match.away_team_id;
  const team = side === "home" ? match.home_team : match.away_team;

  if (hasRealTeamId(teamId)) {
    if (team && isResolvedTeamName(team.name)) return false;

    const englishNameKey = side === "home" ? "home_team_name_en" : "away_team_name_en";
    const englishName =
      typeof payload[englishNameKey] === "string" ? payload[englishNameKey] : "";
    if (isResolvedTeamName(englishName)) return false;
  }

  if (slotLabel && PLACEHOLDER_LABEL.test(slotLabel)) {
    return true;
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
