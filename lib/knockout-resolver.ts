import {
  computeGroupStandingsFromMatches,
  getQualifiedThirdPlaceGroups,
  type ComputedGroupTable
} from "@/lib/group-standings-compute";
import { isMatchFinished } from "@/lib/match-status";
import {
  ANNEX_C_WINNER_GROUPS,
  findAnnexCRow,
  getThirdPlaceGroupForWinner
} from "@/lib/wc26-annex-c";
import type { Match, Team } from "@/types/domain";

export type KnockoutSlot =
  | { kind: "winner_group"; group: string }
  | { kind: "runner_up_group"; group: string }
  | { kind: "third_place_pool"; winnerGroup: string; candidateGroups: string[] }
  | { kind: "match_winner"; matchId: string }
  | { kind: "match_loser"; matchId: string }
  | { kind: "unknown"; label: string };

export type ResolvedKnockoutTeams = {
  homeTeamId: string | null;
  awayTeamId: string | null;
};

export type KnockoutResolutionMismatch = {
  matchId: string;
  side: "home" | "away";
  localTeamId: string;
  apiTeamId: string;
};

const GROUP_LETTERS = "ABCDEFGHIJKL";

const WINNER_GROUP_RE = /^winner\s+group\s+([a-l])$/i;
const RUNNER_UP_GROUP_RE = /^runner(?:-|\s)?up\s+group\s+([a-l])$/i;
const THIRD_POOL_RE = /^3rd\s+group\s+([a-l](?:\/[a-l])*)/i;
const WINNER_MATCH_RE = /^winner\s+match\s+(\d+)$/i;
const LOSER_MATCH_RE = /^loser\s+match\s+(\d+)$/i;

function normalizeLabel(value: string | null | undefined) {
  return value?.trim().replace(/\s+/g, " ") ?? "";
}

function parseCandidateGroups(raw: string) {
  return raw
    .split("/")
    .map((group) => group.trim().toUpperCase())
    .filter((group) => GROUP_LETTERS.includes(group));
}

export function parseKnockoutSlot(label: string): KnockoutSlot {
  const normalized = normalizeLabel(label);
  if (!normalized) return { kind: "unknown", label: "" };

  const winnerGroup = normalized.match(WINNER_GROUP_RE);
  if (winnerGroup) return { kind: "winner_group", group: winnerGroup[1].toUpperCase() };

  const runnerUp = normalized.match(RUNNER_UP_GROUP_RE);
  if (runnerUp) return { kind: "runner_up_group", group: runnerUp[1].toUpperCase() };

  const thirdPool = normalized.match(THIRD_POOL_RE);
  if (thirdPool) {
    return {
      kind: "third_place_pool",
      winnerGroup: "",
      candidateGroups: parseCandidateGroups(thirdPool[1])
    };
  }

  const winnerMatch = normalized.match(WINNER_MATCH_RE);
  if (winnerMatch) return { kind: "match_winner", matchId: winnerMatch[1] };

  const loserMatch = normalized.match(LOSER_MATCH_RE);
  if (loserMatch) return { kind: "match_loser", matchId: loserMatch[1] };

  return { kind: "unknown", label: normalized };
}

function getMatchSideLabel(match: Match, side: "home" | "away") {
  const payload = match.payload ?? {};
  const labelKey = side === "home" ? "home_team_label" : "away_team_label";
  const nameKey = side === "home" ? "home_team_name_en" : "away_team_name_en";
  const label = typeof payload[labelKey] === "string" ? payload[labelKey] : "";
  const name = typeof payload[nameKey] === "string" ? payload[nameKey] : "";
  return normalizeLabel(label || name);
}

function getGroupTable(tables: ComputedGroupTable[], group: string) {
  return tables.find((table) => table.group === group.toUpperCase()) ?? null;
}

function getMatchParticipant(match: Match | undefined, side: "home" | "away") {
  if (!match) return null;
  return side === "home" ? match.home_team_id : match.away_team_id;
}

function getMatchWinnerId(match: Match | undefined) {
  if (!match || !isMatchFinished(match)) return null;
  if (match.score_home == null || match.score_away == null) return null;
  if (match.score_home > match.score_away) return match.home_team_id;
  if (match.score_away > match.score_home) return match.away_team_id;
  return null;
}

function getMatchLoserId(match: Match | undefined) {
  if (!match || !isMatchFinished(match)) return null;
  if (match.score_home == null || match.score_away == null) return null;
  if (match.score_home > match.score_away) return match.away_team_id;
  if (match.score_away > match.score_home) return match.home_team_id;
  return null;
}

function resolveSlot(
  slot: KnockoutSlot,
  context: {
    tables: ComputedGroupTable[];
    annexRow: string | null;
    qualifiedThirdGroups: Set<string>;
    matchesById: Map<string, Match>;
    winnerGroupForThird?: string;
  }
): string | null {
  switch (slot.kind) {
    case "winner_group": {
      const table = getGroupTable(context.tables, slot.group);
      return table?.winnerId ?? null;
    }
    case "runner_up_group": {
      const table = getGroupTable(context.tables, slot.group);
      return table?.runnerUpId ?? null;
    }
    case "third_place_pool": {
      if (!context.annexRow || !context.winnerGroupForThird) return null;
      const assignedGroup = getThirdPlaceGroupForWinner(
        context.annexRow,
        context.winnerGroupForThird
      );
      if (!assignedGroup) return null;
      if (!slot.candidateGroups.includes(assignedGroup)) return null;
      if (!context.qualifiedThirdGroups.has(assignedGroup)) return null;
      const table = getGroupTable(context.tables, assignedGroup);
      return table?.thirdId ?? null;
    }
    case "match_winner":
      return getMatchWinnerId(context.matchesById.get(slot.matchId));
    case "match_loser":
      return getMatchLoserId(context.matchesById.get(slot.matchId));
    default:
      return null;
  }
}

function parseHomeWinnerGroup(slot: KnockoutSlot) {
  return slot.kind === "winner_group" ? slot.group : null;
}

export function resolveKnockoutMatchTeams(
  match: Match,
  tables: ComputedGroupTable[],
  annexRow: string | null,
  qualifiedThirdGroups: Set<string>,
  matchesById: Map<string, Match>
): ResolvedKnockoutTeams {
  const homeSlot = parseKnockoutSlot(getMatchSideLabel(match, "home"));
  const awaySlot = parseKnockoutSlot(getMatchSideLabel(match, "away"));
  const homeWinnerGroup = parseHomeWinnerGroup(homeSlot);

  const awaySlotResolved: KnockoutSlot =
    awaySlot.kind === "third_place_pool" && homeWinnerGroup
      ? { ...awaySlot, winnerGroup: homeWinnerGroup }
      : awaySlot;

  const context = {
    tables,
    annexRow,
    qualifiedThirdGroups,
    matchesById,
    winnerGroupForThird: homeWinnerGroup ?? undefined
  };

  return {
    homeTeamId: resolveSlot(homeSlot, context),
    awayTeamId: resolveSlot(awaySlotResolved, {
      ...context,
      winnerGroupForThird:
        awaySlotResolved.kind === "third_place_pool"
          ? awaySlotResolved.winnerGroup || homeWinnerGroup || undefined
          : undefined
    })
  };
}

export function resolveAllKnockoutTeams(matches: Match[], teams: Team[]) {
  const tables = computeGroupStandingsFromMatches(matches, teams);
  const { qualifiedGroups } = getQualifiedThirdPlaceGroups(tables);
  const annexRow =
    qualifiedGroups.length === 8 ? findAnnexCRow(qualifiedGroups) : null;
  const qualifiedThirdGroups = new Set(qualifiedGroups);
  const matchesById = new Map(matches.map((match) => [match.external_id, match]));

  const knockoutMatches = matches.filter((match) => match.stage !== "Grupos");
  const resolved = new Map<string, ResolvedKnockoutTeams>();

  for (let pass = 0; pass < 6; pass += 1) {
    let changed = false;
    for (const match of knockoutMatches) {
      const next = resolveKnockoutMatchTeams(
        match,
        tables,
        annexRow,
        qualifiedThirdGroups,
        matchesById
      );

      const enriched = { ...match };
      if (next.homeTeamId) enriched.home_team_id = next.homeTeamId;
      if (next.awayTeamId) enriched.away_team_id = next.awayTeamId;
      matchesById.set(match.external_id, enriched);

      const previous = resolved.get(match.external_id);
      if (
        !previous ||
        previous.homeTeamId !== next.homeTeamId ||
        previous.awayTeamId !== next.awayTeamId
      ) {
        changed = true;
        resolved.set(match.external_id, next);
      }
    }
    if (!changed) break;
  }

  return {
    tables,
    qualifiedGroups,
    annexRow,
    resolved
  };
}

export function hasRealTeamId(teamId: string | null | undefined) {
  return Boolean(teamId && teamId !== "0");
}

export function findKnockoutMismatches(matches: Match[], teams: Team[]) {
  const { resolved } = resolveAllKnockoutTeams(matches, teams);
  const mismatches: KnockoutResolutionMismatch[] = [];

  for (const match of matches) {
    if (match.stage === "Grupos") continue;
    const local = resolved.get(match.external_id);
    if (!local) continue;

    for (const side of ["home", "away"] as const) {
      const apiTeamId = side === "home" ? match.home_team_id : match.away_team_id;
      const localTeamId = side === "home" ? local.homeTeamId : local.awayTeamId;
      if (
        hasRealTeamId(apiTeamId) &&
        hasRealTeamId(localTeamId) &&
        apiTeamId !== localTeamId
      ) {
        mismatches.push({
          matchId: match.external_id,
          side,
          apiTeamId: apiTeamId!,
          localTeamId: localTeamId!
        });
      }
    }
  }

  return mismatches;
}

export function isThirdPlaceWinnerMatch(match: Match) {
  const home = parseKnockoutSlot(getMatchSideLabel(match, "home"));
  const away = parseKnockoutSlot(getMatchSideLabel(match, "away"));
  return (
    home.kind === "winner_group" &&
    ANNEX_C_WINNER_GROUPS.includes(
      home.group as (typeof ANNEX_C_WINNER_GROUPS)[number]
    ) &&
    away.kind === "third_place_pool"
  );
}
