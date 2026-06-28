export const TOURNAMENT_CODE = "WC2026";
export const SESSION_COOKIE = "bolao_session";

export const SCORING_RULES = {
  exactScore: 10,
  correctWinner: 7,
  correctDraw: 5,
  knockoutQualified: 5,
  knockoutMethodRegular: 2,
  knockoutMethodExtraTime: 3,
  knockoutMethodPenalties: 4,
  topFourExactPosition: 10,
  topFourIncluded: 5
} as const;

export const FINISHED_STATUSES = new Set([
  "FINISHED",
  "FT",
  "AET",
  "PEN",
  "FINAL"
]);

export const LOCKED_STATUSES = new Set([
  ...FINISHED_STATUSES,
  "LIVE",
  "IN_PLAY",
  "1H",
  "HT",
  "2H",
  "ET",
  "P"
]);
