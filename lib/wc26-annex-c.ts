import annexRows from "@/lib/data/wc26-annex-c-rows.json";

/** Group winners that face a third-placed team in the round of 32 (FIFA Art. 12.6). */
export const ANNEX_C_WINNER_GROUPS = ["A", "B", "D", "E", "G", "I", "K", "L"] as const;

const ROWS = annexRows as string[];

const rowByCombination = new Map<string, string>();
for (const row of ROWS) {
  rowByCombination.set([...row].sort().join(""), row);
}

export function findAnnexCRow(qualifyingThirdGroups: string[]) {
  if (qualifyingThirdGroups.length !== 8) return null;
  const key = [...qualifyingThirdGroups].map((g) => g.toUpperCase()).sort().join("");
  return rowByCombination.get(key) ?? null;
}

export function getThirdPlaceGroupForWinner(
  annexRow: string,
  winnerGroup: string
) {
  const index = ANNEX_C_WINNER_GROUPS.indexOf(
    winnerGroup.toUpperCase() as (typeof ANNEX_C_WINNER_GROUPS)[number]
  );
  if (index === -1) return null;
  return annexRow[index] ?? null;
}
