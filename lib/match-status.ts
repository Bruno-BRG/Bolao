import { FINISHED_STATUSES } from "@/lib/constants";

export const LIVE_STATUSES = new Set([
  "LIVE",
  "IN_PLAY",
  "1H",
  "HT",
  "2H",
  "ET",
  "P"
]);

export const MATCH_STATUS_OPTIONS = [
  "SCHEDULED",
  "LIVE",
  "IN_PLAY",
  "1H",
  "HT",
  "2H",
  "ET",
  "P",
  "FINISHED",
  "FT",
  "AET",
  "PEN"
] as const;

export type MatchStatusOption = (typeof MATCH_STATUS_OPTIONS)[number];

export function isMatchLive(match: { status: string }) {
  return LIVE_STATUSES.has(match.status.toUpperCase());
}

export function isMatchFinished(match: { status: string }) {
  return FINISHED_STATUSES.has(match.status.toUpperCase());
}
