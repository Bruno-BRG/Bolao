import type { RankingRow } from "@/types/domain";

export type RankingView = "geral" | "eliminatorias";

export function getEliminatoriasPoints(row: RankingRow) {
  return (row.knockoutPoints ?? 0) + (row.bracketPoints ?? 0);
}

export function getRankingPoints(row: RankingRow, view: RankingView) {
  if (view === "eliminatorias") return getEliminatoriasPoints(row);
  return row.totalPoints;
}

function compareRankingRows(a: RankingRow, b: RankingRow, view: RankingView) {
  const pointsDiff = getRankingPoints(b, view) - getRankingPoints(a, view);
  if (pointsDiff !== 0) return pointsDiff;

  if (view === "eliminatorias") {
    const knockoutDiff = (b.knockoutPoints ?? 0) - (a.knockoutPoints ?? 0);
    if (knockoutDiff !== 0) return knockoutDiff;

    const bracketDiff = (b.bracketPoints ?? 0) - (a.bracketPoints ?? 0);
    if (bracketDiff !== 0) return bracketDiff;
  }

  return (
    b.exactScores - a.exactScores ||
    b.correctOutcomes - a.correctOutcomes ||
    a.blanks - b.blanks
  );
}

export function buildRankingView(rows: RankingRow[], view: RankingView): RankingRow[] {
  return [...rows]
    .sort((a, b) => compareRankingRows(a, b, view))
    .map((row, index) => ({
      ...row,
      position: index + 1
    }));
}
