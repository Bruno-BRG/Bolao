import { FINISHED_STATUSES, TOURNAMENT_CODE } from "@/lib/constants";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { listPredictionRows, updatePredictionDocument } from "@/repositories/predictions.repo";
import { listMatches, listTeams } from "@/repositories/worldcup.repo";
import { calculatePredictionScore } from "@/services/scoring.service";
import { ensureWorldCupData } from "@/services/worldcup-sync.service";
import type { RankingRow } from "@/types/domain";

type PredictionRow = Awaited<ReturnType<typeof listPredictionRows>>[number] & {
  users?: { username?: string; created_at?: string } | { username?: string; created_at?: string }[];
};

function getUserInfo(row: PredictionRow) {
  const users = Array.isArray(row.users) ? row.users[0] : row.users;
  return {
    username: users?.username ?? "usuario",
    createdAt: users?.created_at ?? row.updated_at
  };
}

export async function recalculateRanking() {
  await ensureWorldCupData().catch(() => undefined);

  const [matches, teams, rows] = await Promise.all([
    listMatches({ refreshIfStale: false }),
    listTeams(),
    listPredictionRows()
  ]);

  const scoredRows = [];
  for (const row of rows) {
    const document = calculatePredictionScore(row.predictions, matches, teams);
    await updatePredictionDocument(row.user_id, document);
    const user = getUserInfo(row as PredictionRow);
    scoredRows.push({
      userId: row.user_id,
      username: user.username,
      totalPoints: document.summary.totalPoints,
      matchPoints: document.summary.matchPoints,
      topFourPoints: document.summary.topFourPoints,
      exactScores: document.summary.exactScores,
      correctOutcomes: document.summary.correctOutcomes,
      closeScores: document.summary.closeScores,
      blanks: document.summary.blanks,
      updatedAt: document.updatedAt,
      createdAt: user.createdAt
    });
  }

  const ranking = scoredRows
    .sort(
      (a, b) =>
        b.totalPoints - a.totalPoints ||
        b.exactScores - a.exactScores ||
        b.correctOutcomes - a.correctOutcomes ||
        a.blanks - b.blanks ||
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    .map((row, index) => ({
      position: index + 1,
      ...row
    }));

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("ranking_snapshots").insert({
    tournament_code: TOURNAMENT_CODE,
    snapshot: ranking
  });
  if (error) throw error;

  return ranking;
}

const RANKING_REFRESH_MAX_AGE_MS = Number(
  process.env.RANKING_REFRESH_MAX_AGE_MINUTES ?? "2"
) * 60 * 1000;

export async function shouldRefreshRanking() {
  const supabase = getSupabaseAdmin();
  const { data: latestSnapshot, error: snapshotError } = await supabase
    .from("ranking_snapshots")
    .select("generated_at")
    .eq("tournament_code", TOURNAMENT_CODE)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (snapshotError) throw snapshotError;
  if (!latestSnapshot?.generated_at) return true;

  const snapshotAt = new Date(latestSnapshot.generated_at).getTime();
  if (Number.isNaN(snapshotAt)) return true;
  if (Date.now() - snapshotAt > RANKING_REFRESH_MAX_AGE_MS) return true;

  const { data: finishedMatches, error: matchesError } = await supabase
    .from("matches_cache")
    .select("updated_at, status")
    .eq("tournament_code", TOURNAMENT_CODE);

  if (matchesError) throw matchesError;

  return (finishedMatches ?? []).some((match) => {
    if (!FINISHED_STATUSES.has(String(match.status).toUpperCase())) return false;
    return new Date(match.updated_at).getTime() > snapshotAt;
  });
}

export async function getLatestRanking(options?: { refreshIfStale?: boolean }) {
  if (options?.refreshIfStale && (await shouldRefreshRanking())) {
    return recalculateRanking();
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("ranking_snapshots")
    .select("snapshot")
    .eq("tournament_code", TOURNAMENT_CODE)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (data?.snapshot) return data.snapshot as RankingRow[];

  const rows = await listPredictionRows();
  return rows
    .map((row, index) => {
      const user = getUserInfo(row as PredictionRow);
      return {
        position: index + 1,
        userId: row.user_id,
        username: user.username,
        totalPoints: row.total_points ?? 0,
        matchPoints: row.match_points ?? 0,
        topFourPoints: row.top_four_points ?? 0,
        exactScores: row.exact_scores ?? 0,
        correctOutcomes: row.correct_outcomes ?? 0,
        closeScores: row.close_scores ?? 0,
        blanks: row.blanks ?? 0,
        updatedAt: row.updated_at
      };
    })
    .sort(
      (a, b) =>
        b.totalPoints - a.totalPoints ||
        b.exactScores - a.exactScores ||
        b.correctOutcomes - a.correctOutcomes ||
        a.blanks - b.blanks
    )
    .map((row, index) => ({ ...row, position: index + 1 }));
}
