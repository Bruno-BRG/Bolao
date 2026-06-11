import { LOCKED_STATUSES } from "@/lib/constants";

export function isMatchLockedForPrediction(
  match: {
    starts_at: string;
    status: string;
  },
  now = Date.now()
) {
  const startsAt = new Date(match.starts_at).getTime();
  if (Number.isNaN(startsAt)) return true;

  return now >= startsAt || LOCKED_STATUSES.has(match.status.toUpperCase());
}
