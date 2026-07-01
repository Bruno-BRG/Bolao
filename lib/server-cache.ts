import { unstable_cache } from "next/cache";
import { TOURNAMENT_CODE } from "@/lib/constants";
import { query } from "@/lib/db";
import { listPredictionSummaries } from "@/repositories/predictions.repo";
import type { RankingRow } from "@/types/domain";

export const PAGE_CACHE_SECONDS = Number(process.env.PAGE_CACHE_SECONDS ?? "45");

export const getCachedRankingSnapshot = unstable_cache(
  async (): Promise<RankingRow[]> => {
    const { rows } = await query<{ snapshot: RankingRow[] }>(
      `SELECT snapshot
       FROM ranking_snapshots
       WHERE tournament_code = $1
       ORDER BY generated_at DESC
       LIMIT 1`,
      [TOURNAMENT_CODE]
    );

    return rows[0]?.snapshot ?? [];
  },
  ["ranking-snapshot", TOURNAMENT_CODE],
  { revalidate: PAGE_CACHE_SECONDS, tags: ["ranking"] }
);

export const getCachedPredictionSummaries = unstable_cache(
  async () => listPredictionSummaries(),
  ["prediction-summaries", TOURNAMENT_CODE],
  { revalidate: PAGE_CACHE_SECONDS, tags: ["predictions"] }
);
