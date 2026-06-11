import { LOCKED_STATUSES } from "@/lib/constants";

export const PREDICTION_LOCK_LEAD_MS = 60 * 60 * 1000;

export function isMatchLockedForPrediction(match: {
  starts_at: string;
  status: string;
}) {
  const startsAt = new Date(match.starts_at).getTime();
  if (Number.isNaN(startsAt)) return true;

  const lockAt = startsAt - PREDICTION_LOCK_LEAD_MS;
  return Date.now() >= lockAt || LOCKED_STATUSES.has(match.status.toUpperCase());
}
