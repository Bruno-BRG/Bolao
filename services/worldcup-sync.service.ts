import { TOURNAMENT_CODE } from "@/lib/constants";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { syncWorldCupFromApiFootball } from "@/services/api-football.service";
import {
  hasWorldCup26TimezoneDrift,
  syncWorldCupFromWorldCup26
} from "@/services/worldcup26.service";

const AUTO_SYNC_MAX_AGE_MINUTES = Number(
  process.env.AUTO_SYNC_MAX_AGE_MINUTES ?? "360"
);

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
  const staleThreshold = new Date(
    Date.now() - AUTO_SYNC_MAX_AGE_MINUTES * 60 * 1000
  ).toISOString();

  const [
    { count: matchesCount, error: countError },
    { data: latestSync, error: syncError },
    { data: sampleMatches, error: sampleError }
  ] = await Promise.all([
    supabase
      .from("matches_cache")
      .select("external_id", { count: "exact", head: true })
      .eq("tournament_code", TOURNAMENT_CODE),
    supabase
      .from("sync_logs")
      .select("created_at, status")
      .eq("provider", provider)
      .eq("status", "success")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    provider === "worldcup26"
      ? supabase
          .from("matches_cache")
          .select("starts_at, payload")
          .eq("tournament_code", TOURNAMENT_CODE)
          .limit(5)
      : Promise.resolve({ data: null, error: null })
  ]);

  if (countError) throw countError;
  if (syncError) throw syncError;
  if (sampleError) throw sampleError;

  const shouldSyncBecauseEmpty = (matchesCount ?? 0) === 0;
  const shouldSyncBecauseStale =
    !latestSync || latestSync.created_at < staleThreshold;
  const shouldSyncBecauseLegacyTimezone =
    provider === "worldcup26" &&
    (sampleMatches ?? []).some((match) =>
      hasWorldCup26TimezoneDrift(match.starts_at, match.payload)
    );

  if (
    !options?.force &&
    !shouldSyncBecauseEmpty &&
    !shouldSyncBecauseStale &&
    !shouldSyncBecauseLegacyTimezone
  ) {
    return { ran: false, reason: "fresh" as const };
  }

  try {
    const syncResult = await syncWorldCupData();
    return {
      ran: true,
      reason: shouldSyncBecauseEmpty
        ? ("empty" as const)
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
