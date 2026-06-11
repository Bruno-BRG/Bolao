import { TOURNAMENT_CODE } from "@/lib/constants";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { createEmptyPredictionDocument } from "@/services/prediction-document";
import type { PredictionDocument } from "@/types/domain";

export async function getOrCreatePredictionDocument(userId: string) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("user_predictions")
    .select("id, predictions, total_points, match_points, top_four_points, exact_scores, correct_outcomes, close_scores, updated_at")
    .eq("user_id", userId)
    .eq("tournament_code", TOURNAMENT_CODE)
    .maybeSingle();

  if (error) throw error;
  if (data) return data;

  const empty = createEmptyPredictionDocument();
  const { data: created, error: createError } = await supabase
    .from("user_predictions")
    .insert({
      user_id: userId,
      tournament_code: TOURNAMENT_CODE,
      predictions: empty
    })
    .select("id, predictions, total_points, match_points, top_four_points, exact_scores, correct_outcomes, close_scores, updated_at")
    .single();

  if (createError) throw createError;
  return created;
}

export async function updatePredictionDocument(
  userId: string,
  document: PredictionDocument
) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("user_predictions")
    .upsert(
      {
        user_id: userId,
        tournament_code: TOURNAMENT_CODE,
        predictions: document,
        total_points: document.summary.totalPoints,
        match_points: document.summary.matchPoints,
        top_four_points: document.summary.topFourPoints,
        exact_scores: document.summary.exactScores,
        correct_outcomes: document.summary.correctOutcomes,
        close_scores: document.summary.closeScores,
        blanks: document.summary.blanks,
        updated_at: new Date().toISOString()
      },
      { onConflict: "user_id,tournament_code" }
    );

  if (error) throw error;
}

export async function listPredictionRows() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("user_predictions")
    .select(
      "user_id, predictions, total_points, match_points, top_four_points, exact_scores, correct_outcomes, close_scores, blanks, updated_at, users(username, created_at)"
    )
    .eq("tournament_code", TOURNAMENT_CODE);

  if (error) throw error;
  return data ?? [];
}
