import type { Match, Team } from "@/types/domain";
import { isMatchFinished } from "@/lib/match-status";

export type ComputedStandingRow = {
  teamId: string;
  group: string;
  mp: number;
  w: number;
  d: number;
  l: number;
  pts: number;
  gf: number;
  ga: number;
  gd: number;
};

export type ComputedGroupTable = {
  group: string;
  standings: ComputedStandingRow[];
  /** True when all 4 teams have played all 3 group matches. */
  complete: boolean;
  winnerId: string | null;
  runnerUpId: string | null;
  thirdId: string | null;
};

const TEAMS_PER_GROUP = 4;
const MATCHES_PER_TEAM = 3;

function isGroupTableComplete(standings: ComputedStandingRow[]) {
  if (standings.length !== TEAMS_PER_GROUP) return false;
  return standings.every((row) => row.mp === MATCHES_PER_TEAM);
}

function sortStandings(a: ComputedStandingRow, b: ComputedStandingRow) {
  return (
    b.pts - a.pts ||
    b.gd - a.gd ||
    b.gf - a.gf ||
    a.teamId.localeCompare(b.teamId)
  );
}

export function buildTeamGroupMap(teams: Team[]) {
  const map = new Map<string, string>();
  for (const team of teams) {
    const groups = team.payload?.groups;
    if (typeof groups === "string" && groups.trim()) {
      map.set(team.external_id, groups.trim().toUpperCase());
    }
  }
  return map;
}

function getGroupFromMatch(match: Match) {
  if (match.group_name?.startsWith("Grupo ")) {
    return match.group_name.replace("Grupo ", "").trim().toUpperCase();
  }

  const payload = match.payload ?? {};
  const group = payload.group;
  return typeof group === "string" ? group.trim().toUpperCase() : null;
}

export function computeGroupStandingsFromMatches(
  matches: Match[],
  teams: Team[]
): ComputedGroupTable[] {
  const teamGroups = buildTeamGroupMap(teams);
  const stats = new Map<string, ComputedStandingRow>();

  for (const match of matches) {
    if (match.stage !== "Grupos" && getGroupFromMatch(match) === null) continue;
    if (!isMatchFinished(match)) continue;
    if (match.score_home == null || match.score_away == null) continue;

    const group = getGroupFromMatch(match);
    if (!group) continue;

    const sides = [
      { teamId: match.home_team_id, goalsFor: match.score_home, goalsAgainst: match.score_away },
      { teamId: match.away_team_id, goalsFor: match.score_away, goalsAgainst: match.score_home }
    ] as const;

    for (const side of sides) {
      if (!side.teamId) continue;
      const row =
        stats.get(side.teamId) ??
        ({
          teamId: side.teamId,
          group: teamGroups.get(side.teamId) ?? group,
          mp: 0,
          w: 0,
          d: 0,
          l: 0,
          pts: 0,
          gf: 0,
          ga: 0,
          gd: 0
        } satisfies ComputedStandingRow);

      row.mp += 1;
      row.gf += side.goalsFor;
      row.ga += side.goalsAgainst;
      row.gd = row.gf - row.ga;

      if (side.goalsFor > side.goalsAgainst) {
        row.w += 1;
        row.pts += 3;
      } else if (side.goalsFor === side.goalsAgainst) {
        row.d += 1;
        row.pts += 1;
      } else {
        row.l += 1;
      }

      stats.set(side.teamId, row);
    }
  }

  const byGroup = new Map<string, ComputedStandingRow[]>();
  for (const row of stats.values()) {
    const standings = byGroup.get(row.group) ?? [];
    standings.push(row);
    byGroup.set(row.group, standings);
  }

  return [...byGroup.entries()]
    .map(([group, standings]) => {
      const sorted = [...standings].sort(sortStandings);
      const complete = isGroupTableComplete(sorted);
      return {
        group,
        standings: sorted,
        complete,
        winnerId: complete ? (sorted[0]?.teamId ?? null) : null,
        runnerUpId: complete ? (sorted[1]?.teamId ?? null) : null,
        thirdId: complete ? (sorted[2]?.teamId ?? null) : null
      };
    })
    .sort((a, b) => a.group.localeCompare(b.group));
}

export function getQualifiedThirdPlaceGroups(tables: ComputedGroupTable[]) {
  const completeTables = tables.filter((table) => table.complete);
  // Third-place qualification is only final once every group has finished.
  if (completeTables.length < 12) {
    return {
      qualifiedGroups: [] as string[],
      qualifiedThirds: [] as Array<{
        group: string;
        pts: number;
        gd: number;
        gf: number;
        teamId: string;
      }>,
      eliminatedThirds: [] as Array<{
        group: string;
        pts: number;
        gd: number;
        gf: number;
        teamId: string;
      }>
    };
  }

  const thirds = completeTables
    .map((table) => {
      const third = table.standings[2];
      if (!third) return null;
      return {
        group: table.group,
        pts: third.pts,
        gd: third.gd,
        gf: third.gf,
        teamId: third.teamId
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort(
      (a, b) =>
        b.pts - a.pts ||
        b.gd - a.gd ||
        b.gf - a.gf ||
        a.group.localeCompare(b.group)
    );

  return {
    qualifiedGroups: thirds.slice(0, 8).map((row) => row.group),
    qualifiedThirds: thirds.slice(0, 8),
    eliminatedThirds: thirds.slice(8)
  };
}
