import { TOURNAMENT_CODE } from "@/lib/constants";
import { query } from "@/lib/db";
import { createEmptyPredictionDocument } from "@/services/prediction-document";
import type { PredictionDocument } from "@/types/domain";

type PredictionRow = {
  id: string;
  user_id: string;
  predictions: PredictionDocument;
  total_points: number;
  match_points: number;
  top_four_points: number;
  exact_scores: number;
  correct_outcomes: number;
  close_scores: number;
  blanks: number;
  updated_at: string;
};

export async function getOrCreatePredictionDocument(userId: string) {
  const { rows } = await query<PredictionRow>(
    `SELECT id, user_id, predictions, total_points, match_points, top_four_points,
            exact_scores, correct_outcomes, close_scores, blanks, updated_at
     FROM user_predictions
     WHERE user_id = $1 AND tournament_code = $2
     LIMIT 1`,
    [userId, TOURNAMENT_CODE]
  );

  if (rows[0]) return rows[0];

  const empty = createEmptyPredictionDocument();
  const { rows: created } = await query<PredictionRow>(
    `INSERT INTO user_predictions (user_id, tournament_code, predictions)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, predictions, total_points, match_points, top_four_points,
               exact_scores, correct_outcomes, close_scores, blanks, updated_at`,
    [userId, TOURNAMENT_CODE, empty]
  );

  return created[0];
}

export async function updatePredictionDocument(
  userId: string,
  document: PredictionDocument
) {
  await query(
    `INSERT INTO user_predictions (
       user_id, tournament_code, predictions, total_points, match_points,
       top_four_points, exact_scores, correct_outcomes, close_scores, blanks, updated_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
     ON CONFLICT (user_id, tournament_code) DO UPDATE SET
       predictions = EXCLUDED.predictions,
       total_points = EXCLUDED.total_points,
       match_points = EXCLUDED.match_points,
       top_four_points = EXCLUDED.top_four_points,
       exact_scores = EXCLUDED.exact_scores,
       correct_outcomes = EXCLUDED.correct_outcomes,
       close_scores = EXCLUDED.close_scores,
       blanks = EXCLUDED.blanks,
       updated_at = NOW()`,
    [
      userId,
      TOURNAMENT_CODE,
      document,
      document.summary.totalPoints,
      document.summary.matchPoints,
      document.summary.topFourPoints,
      document.summary.exactScores,
      document.summary.correctOutcomes,
      document.summary.closeScores,
      document.summary.blanks
    ]
  );
}

export async function listPredictionRows() {
  const { rows } = await query<
    PredictionRow & {
      users: { username: string; created_at: string } | null;
    }
  >(
    `SELECT
       up.user_id,
       up.predictions,
       up.total_points,
       up.match_points,
       up.top_four_points,
       up.exact_scores,
       up.correct_outcomes,
       up.close_scores,
       up.blanks,
       up.updated_at,
       json_build_object('username', u.username, 'created_at', u.created_at) AS users
     FROM user_predictions up
     JOIN users u ON u.id = up.user_id
     WHERE up.tournament_code = $1`,
    [TOURNAMENT_CODE]
  );

  return rows;
}
