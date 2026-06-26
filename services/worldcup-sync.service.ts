import { FINISHED_STATUSES, TOURNAMENT_CODE } from "@/lib/constants";
import {
  countMatches,
  getLatestSuccessfulSync,
  insertSyncLog
} from "@/lib/cache-sync";
import { query } from "@/lib/db";
import {
  hasWorldCup26TimezoneDrift,
  syncWorldCupFromWorldCup26
} from "@/services/worldcup26.service";
import { enrichKnockoutBracketFromStandings } from "@/services/knockout-enrichment.service";

const AUTO_SYNC_MAX_AGE_MINUTES = Number(
  process.env.AUTO_SYNC_MAX_AGE_MINUTES ?? "360"
);
const LIVE_SYNC_MAX_AGE_MINUTES = Number(
  process.env.LIVE_SYNC_MAX_AGE_MINUTES ?? "5"
);
const WORLDCUP_PROVIDER = "worldcup26";

async function listMatchSyncSignals() {
  const { rows } = await query<{
    starts_at: string;
    status: string;
    updated_at: string;
  }>(
    `SELECT starts_at, status, updated_at
     FROM matches_cache
     WHERE tournament_code = $1`,
    [TOURNAMENT_CODE]
  );
  return rows;
}

async function resolveSyncMaxAgeMinutes() {
  const now = Date.now();
  const matches = await listMatchSyncSignals();
  const inActiveWindow = matches.some((match) => {
    const status = String(match.status).toUpperCase();
    if (status === "LIVE") return true;

    const startsAt = new Date(match.starts_at).getTime();
    if (Number.isNaN(startsAt)) return false;

    const hoursFromKickoff = (now - startsAt) / (60 * 60 * 1000);
    if (FINISHED_STATUSES.has(status)) {
      return hoursFromKickoff >= 0 && hoursFromKickoff <= 12;
    }

    if (hoursFromKickoff >= 0 && hoursFromKickoff <= 4 && status === "SCHEDULED") {
      return true;
    }

    const hoursUntilKickoff = (startsAt - now) / (60 * 60 * 1000);
    return hoursUntilKickoff >= 0 && hoursUntilKickoff <= 3;
  });

  return inActiveWindow ? LIVE_SYNC_MAX_AGE_MINUTES : AUTO_SYNC_MAX_AGE_MINUTES;
}

async function hasStaleLiveMatchState() {
  const now = Date.now();
  const matches = await listMatchSyncSignals();

  return matches.some((match) => {
    const status = String(match.status).toUpperCase();
    const startsAt = new Date(match.starts_at).getTime();
    if (Number.isNaN(startsAt)) return false;

    const hoursFromKickoff = (now - startsAt) / (60 * 60 * 1000);

    if (hoursFromKickoff >= 0 && hoursFromKickoff <= 4 && status === "SCHEDULED") {
      return true;
    }

    if (status === "LIVE") {
      const updatedAt = new Date(match.updated_at).getTime();
      if (Number.isNaN(updatedAt)) return true;
      return now - updatedAt > LIVE_SYNC_MAX_AGE_MINUTES * 60 * 1000;
    }

    return false;
  });
}

export function getWorldCupProvider() {
  return WORLDCUP_PROVIDER;
}

async function refreshKnockoutBracketFromStandings() {
  try {
    await enrichKnockoutBracketFromStandings();
  } catch (error) {
    console.warn("[knockout-enrichment] refresh failed:", error);
  }
}

export async function syncWorldCupData(options?: { allowGithubFallback?: boolean }) {
  return {
    provider: WORLDCUP_PROVIDER,
    ...(await syncWorldCupFromWorldCup26({
      allowGithubFallback: options?.allowGithubFallback
    }))
  };
}

export async function ensureWorldCupData(options?: { force?: boolean }) {
  const now = Date.now();
  const liveStaleThreshold = new Date(
    now - LIVE_SYNC_MAX_AGE_MINUTES * 60 * 1000
  ).toISOString();
  const latestSync = await getLatestSuccessfulSync(WORLDCUP_PROVIDER);
  const liveStateStale = await hasStaleLiveMatchState();

  if (
    !options?.force &&
    !liveStateStale &&
    latestSync?.created_at &&
    latestSync.created_at >= liveStaleThreshold
  ) {
    await refreshKnockoutBracketFromStandings();
    return { ran: false, reason: "fresh" as const };
  }

  const syncMaxAgeMinutes = await resolveSyncMaxAgeMinutes();
  const staleThreshold = new Date(
    now - syncMaxAgeMinutes * 60 * 1000
  ).toISOString();

  const matchesCount = await countMatches();
  const sampleMatches = (
    await query<{ starts_at: string; payload: Record<string, unknown> }>(
      `SELECT starts_at, payload
       FROM matches_cache
       WHERE tournament_code = $1
       LIMIT 5`,
      [TOURNAMENT_CODE]
    )
  ).rows;

  const shouldSyncBecauseEmpty = matchesCount === 0;
  const shouldSyncBecauseStale =
    !latestSync || latestSync.created_at < staleThreshold;
  const shouldSyncBecauseLegacyTimezone = sampleMatches.some((match) =>
    hasWorldCup26TimezoneDrift(match.starts_at, match.payload)
  );
  const shouldSyncBecauseLiveStateStale = liveStateStale;

  if (
    !options?.force &&
    !shouldSyncBecauseEmpty &&
    !shouldSyncBecauseStale &&
    !shouldSyncBecauseLegacyTimezone &&
    !shouldSyncBecauseLiveStateStale
  ) {
    await refreshKnockoutBracketFromStandings();
    return { ran: false, reason: "fresh" as const };
  }

  try {
    const syncResult = await syncWorldCupData();
    return {
      ran: true,
      reason: shouldSyncBecauseEmpty
        ? ("empty" as const)
        : shouldSyncBecauseLiveStateStale
          ? ("live-stale" as const)
          : shouldSyncBecauseLegacyTimezone
            ? ("repair" as const)
            : ("stale" as const),
      syncResult
    };
  } catch (error) {
    await insertSyncLog({
      provider: WORLDCUP_PROVIDER,
      status: "error",
      message: (error as Error).message,
      payload: { auto: true }
    });

    return {
      ran: false,
      reason: "error" as const,
      error: (error as Error).message
    };
  }
}
