import { revalidateTag } from "next/cache";
import { FINISHED_STATUSES, TOURNAMENT_CODE } from "@/lib/constants";
import { query } from "@/lib/db";
import { getCachedRankingSnapshot } from "@/lib/server-cache";
import {
  loadPredictionDocumentsForRecalc,
  listPredictionSummaries,
  updatePredictionDocument
} from "@/repositories/predictions.repo";
import { listMatches, listTeamsForScoring } from "@/repositories/worldcup.repo";
import { calculatePredictionScore } from "@/services/scoring.service";
import { ensureWorldCupData } from "@/services/worldcup-sync.service";
import type { RankingRow } from "@/types/domain";

export async function recalculateRanking() {
  await ensureWorldCupData().catch(() => undefined);

  const [matches, teams, rows] = await Promise.all([
    listMatches({ refreshIfStale: false }),
    listTeamsForScoring(),
    loadPredictionDocumentsForRecalc()
  ]);

  const scoredRows = rows.map((row) => {
    const document = calculatePredictionScore(row.document, matches, teams);
    return {
      row,
      document
    };
  });

  await Promise.all(
    scoredRows.map(({ row, document }) => updatePredictionDocument(row.userId, document))
  );

  const ranking = scoredRows
    .map(({ row, document }) => ({
      userId: row.userId,
      username: row.username,
      totalPoints: document.summary.totalPoints,
      matchPoints: document.summary.matchPoints,
      knockoutPoints: document.summary.knockoutPoints,
      topFourPoints: document.summary.topFourPoints,
      bracketPoints: document.summary.bracketPoints,
      exactScores: document.summary.exactScores,
      correctOutcomes: document.summary.correctOutcomes,
      closeScores: document.summary.closeScores,
      blanks: document.summary.blanks,
      updatedAt: document.updatedAt,
      createdAt: row.createdAt
    }))
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

  await query(
    `INSERT INTO ranking_snapshots (tournament_code, snapshot)
     VALUES ($1, $2::jsonb)`,
    [TOURNAMENT_CODE, JSON.stringify(ranking)]
  );

  revalidateTag("ranking");

  return ranking;
}

const RANKING_REFRESH_MAX_AGE_MS = Number(
  process.env.RANKING_REFRESH_MAX_AGE_MINUTES ?? "2"
) * 60 * 1000;

const FINISHED_STATUS_LIST = [...FINISHED_STATUSES];

export async function shouldRefreshRanking() {
  const { rows: snapshotRows } = await query<{ generated_at: string }>(
    `SELECT generated_at
     FROM ranking_snapshots
     WHERE tournament_code = $1
     ORDER BY generated_at DESC
     LIMIT 1`,
    [TOURNAMENT_CODE]
  );

  const latestSnapshot = snapshotRows[0];
  if (!latestSnapshot?.generated_at) return true;

  const snapshotAt = new Date(latestSnapshot.generated_at).toISOString();
  if (Number.isNaN(new Date(snapshotAt).getTime())) return true;
  if (Date.now() - new Date(snapshotAt).getTime() > RANKING_REFRESH_MAX_AGE_MS) {
    return true;
  }

  const { rows } = await query<{ needs_refresh: boolean }>(
    `SELECT EXISTS (
       SELECT 1
       FROM matches_cache
       WHERE tournament_code = $1
         AND status = ANY($2::text[])
         AND updated_at > $3::timestamptz
       LIMIT 1
     ) AS needs_refresh`,
    [TOURNAMENT_CODE, FINISHED_STATUS_LIST, snapshotAt]
  );

  return rows[0]?.needs_refresh ?? false;
}

export async function getLatestRanking(options?: { refreshIfStale?: boolean }) {
  if (options?.refreshIfStale && (await shouldRefreshRanking())) {
    return recalculateRanking();
  }

  const cached = await getCachedRankingSnapshot();
  if (cached.length > 0) return cached;

  const predictionRows = await listPredictionSummaries();
  return predictionRows
    .map((row) => {
      const users = row.users;
      return {
        position: 0,
        userId: row.user_id,
        username: users?.username ?? "usuario",
        totalPoints: row.total_points ?? 0,
        matchPoints: row.match_points ?? 0,
        knockoutPoints: row.knockout_points ?? 0,
        topFourPoints: row.top_four_points ?? 0,
        bracketPoints: row.bracket_points ?? 0,
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
