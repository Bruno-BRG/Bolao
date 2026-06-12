import { FINISHED_STATUSES, TOURNAMENT_CODE } from "@/lib/constants";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { syncWorldCupFromApiFootball } from "@/services/api-football.service";
import {
  hasWorldCup26TimezoneDrift,
  syncWorldCupFromWorldCup26
} from "@/services/worldcup26.service";

const AUTO_SYNC_MAX_AGE_MINUTES = Number(
  process.env.AUTO_SYNC_MAX_AGE_MINUTES ?? "360"
);
const LIVE_SYNC_MAX_AGE_MINUTES = Number(
  process.env.LIVE_SYNC_MAX_AGE_MINUTES ?? "5"
);

async function listMatchSyncSignals() {
  const supabase = getSupabaseAdmin();
  const { data: matches, error } = await supabase
    .from("matches_cache")
    .select("starts_at, status, updated_at")
    .eq("tournament_code", TOURNAMENT_CODE);

  if (error) throw error;
  return matches ?? [];
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

    // Kickoff passed but DB still SCHEDULED — keep syncing frequently.
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
  return (process.env.FOOTBALL_PROVIDER ?? "worldcup26").toLowerCase();
}

export async function syncWorldCupData() {
  const provider = getWorldCupProvider();

  if (provider === "worldcup26") {
    return { provider, ...(await syncWorldCupFromWorldCup26()) };
  }

  if (provider === "api-football") {
    return { provider, ...(await syncWorldCupFromApiFootball()) };
  }

  throw new Error(`Unsupported provider "${provider}".`);
}

export async function ensureWorldCupData(options?: { force?: boolean }) {
  const provider = getWorldCupProvider();
  if (provider === "api-football" && !process.env.FOOTBALL_API_KEY) {
    return { ran: false, reason: "missing-key" as const };
  }

  const supabase = getSupabaseAdmin();
  const now = Date.now();
  const liveStaleThreshold = new Date(
    now - LIVE_SYNC_MAX_AGE_MINUTES * 60 * 1000
  ).toISOString();
  const { data: latestSync, error: syncError } = await supabase
    .from("sync_logs")
    .select("created_at, status")
    .eq("provider", provider)
    .eq("status", "success")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (syncError) throw syncError;

  const liveStateStale = await hasStaleLiveMatchState();

  if (
    !options?.force &&
    !liveStateStale &&
    latestSync?.created_at &&
    latestSync.created_at >= liveStaleThreshold
  ) {
    return { ran: false, reason: "fresh" as const };
  }

  const syncMaxAgeMinutes = await resolveSyncMaxAgeMinutes();
  const staleThreshold = new Date(
    now - syncMaxAgeMinutes * 60 * 1000
  ).toISOString();

  const [
    { count: matchesCount, error: countError },
    { data: sampleMatches, error: sampleError }
  ] = await Promise.all([
    supabase
      .from("matches_cache")
      .select("external_id", { count: "exact", head: true })
      .eq("tournament_code", TOURNAMENT_CODE),
    provider === "worldcup26"
      ? supabase
          .from("matches_cache")
          .select("starts_at, payload")
          .eq("tournament_code", TOURNAMENT_CODE)
          .limit(5)
      : Promise.resolve({ data: null, error: null })
  ]);

  if (countError) throw countError;
  if (sampleError) throw sampleError;

  const shouldSyncBecauseEmpty = (matchesCount ?? 0) === 0;
  const shouldSyncBecauseStale =
    !latestSync || latestSync.created_at < staleThreshold;
  const shouldSyncBecauseLegacyTimezone =
    provider === "worldcup26" &&
    (sampleMatches ?? []).some((match) =>
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
    await supabase.from("sync_logs").insert({
      provider,
      status: "error",
      message: (error as Error).message,
      payload: {
        auto: true
      }
    });

    return {
      ran: false,
      reason: "error" as const,
      error: (error as Error).message
    };
  }
}
