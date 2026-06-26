/** FIFA World Cup 2026 knockout tree (matches 73–104). */

export type BracketPair = {
  topMatchId: string;
  bottomMatchId: string;
  feedsMatchId: string;
};

export type BracketHalf = {
  id: "top" | "bottom";
  label: string;
  r32Pairs: BracketPair[];
  r16MatchIds: [string, string, string, string];
  qfMatchIds: [string, string];
  semifinalMatchId: string;
};

export const KNOCKOUT_FINAL_MATCH_ID = "104";
export const KNOCKOUT_THIRD_PLACE_MATCH_ID = "103";

export const TOP_BRACKET_HALF: BracketHalf = {
  id: "top",
  label: "Chave superior",
  r32Pairs: [
    { topMatchId: "73", bottomMatchId: "75", feedsMatchId: "90" },
    { topMatchId: "74", bottomMatchId: "77", feedsMatchId: "89" },
    { topMatchId: "76", bottomMatchId: "78", feedsMatchId: "91" },
    { topMatchId: "79", bottomMatchId: "80", feedsMatchId: "92" }
  ],
  r16MatchIds: ["90", "89", "91", "92"],
  qfMatchIds: ["97", "99"],
  semifinalMatchId: "101"
};

export const BOTTOM_BRACKET_HALF: BracketHalf = {
  id: "bottom",
  label: "Chave inferior",
  r32Pairs: [
    { topMatchId: "81", bottomMatchId: "82", feedsMatchId: "94" },
    { topMatchId: "83", bottomMatchId: "84", feedsMatchId: "93" },
    { topMatchId: "86", bottomMatchId: "88", feedsMatchId: "95" },
    { topMatchId: "85", bottomMatchId: "87", feedsMatchId: "96" }
  ],
  r16MatchIds: ["94", "93", "95", "96"],
  qfMatchIds: ["98", "100"],
  semifinalMatchId: "102"
};

export const BRACKET_HALVES = [TOP_BRACKET_HALF, BOTTOM_BRACKET_HALF] as const;

export function collectBracketMatchIds(half: BracketHalf) {
  const ids = new Set<string>();
  for (const pair of half.r32Pairs) {
    ids.add(pair.topMatchId);
    ids.add(pair.bottomMatchId);
    ids.add(pair.feedsMatchId);
  }
  for (const matchId of half.r16MatchIds) ids.add(matchId);
  for (const matchId of half.qfMatchIds) ids.add(matchId);
  ids.add(half.semifinalMatchId);
  return ids;
}
