import { TOURNAMENT_CODE } from "@/lib/constants";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { syncWorldCupFromApiFootball } from "@/services/api-football.service";
import { syncWorldCupFromWorldCup26 } from "@/services/worldcup26.service";

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

  const [{ count: matchesCount, error: countError }, { data: latestSync, error: syncError }] =
    await Promise.all([
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
        .maybeSingle()
    ]);

  if (countError) throw countError;
  if (syncError) throw syncError;

  const shouldSyncBecauseEmpty = (matchesCount ?? 0) === 0;
  const shouldSyncBecauseStale =
    !latestSync || latestSync.created_at < staleThreshold;

  if (!options?.force && !shouldSyncBecauseEmpty && !shouldSyncBecauseStale) {
    return { ran: false, reason: "fresh" as const };
  }

  try {
    const syncResult = await syncWorldCupData();
    return {
      ran: true,
      reason: shouldSyncBecauseEmpty ? ("empty" as const) : ("stale" as const),
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
