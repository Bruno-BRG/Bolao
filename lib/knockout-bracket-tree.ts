/**
 * FIFA World Cup 2026 knockout tree (matches 73–104).
 *
 * The match order in each round follows an in-order traversal of the bracket
 * binary tree, so a single left-to-right column layout renders without any
 * crossing connectors (each round-N match sits at the vertical midpoint of its
 * two feeder matches in round N-1).
 */

export type BracketRound = {
  id: string;
  title: string;
  matchIds: string[];
};

export const KNOCKOUT_THIRD_PLACE_MATCH_ID = "103";
export const KNOCKOUT_FINAL_MATCH_ID = "104";

export const KNOCKOUT_ROUNDS: BracketRound[] = [
  {
    id: "r32",
    title: "32 avos",
    matchIds: [
      "73",
      "75",
      "74",
      "77",
      "83",
      "84",
      "81",
      "82",
      "76",
      "78",
      "79",
      "80",
      "86",
      "88",
      "85",
      "87"
    ]
  },
  {
    id: "r16",
    title: "Oitavas",
    matchIds: ["90", "89", "93", "94", "91", "92", "95", "96"]
  },
  {
    id: "qf",
    title: "Quartas",
    matchIds: ["97", "98", "99", "100"]
  },
  {
    id: "sf",
    title: "Semifinal",
    matchIds: ["101", "102"]
  },
  {
    id: "final",
    title: "Final",
    matchIds: [KNOCKOUT_FINAL_MATCH_ID]
  }
];

export function collectBracketMatchIds() {
  const ids = new Set<string>();
  for (const round of KNOCKOUT_ROUNDS) {
    for (const matchId of round.matchIds) ids.add(matchId);
  }
  ids.add(KNOCKOUT_THIRD_PLACE_MATCH_ID);
  return ids;
}
