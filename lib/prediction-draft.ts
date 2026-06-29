import type { DecisionMethod } from "@/lib/decision-method";

export const PREDICTION_DRAFT_STORAGE_KEY = "bolao:prediction-drafts:v2";
const LEGACY_DRAFT_STORAGE_KEY = "bolao:prediction-drafts:v1";

export type PredictionDraft = {
  homeGoals: number;
  awayGoals: number;
  predictedWinnerTeamId?: string | null;
  predictedDecidedBy?: DecisionMethod | null;
  updatedAt: string;
};

export type PredictionDraftMap = Record<string, PredictionDraft>;

export function readPredictionDrafts(): PredictionDraftMap {
  if (typeof window === "undefined") return {};

  try {
    const raw =
      window.localStorage.getItem(PREDICTION_DRAFT_STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_DRAFT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as PredictionDraftMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function writePredictionDrafts(drafts: PredictionDraftMap) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PREDICTION_DRAFT_STORAGE_KEY, JSON.stringify(drafts));
}

export function upsertPredictionDraft(
  matchId: string,
  homeGoals: number,
  awayGoals: number,
  knockout?: {
    predictedWinnerTeamId: string | null;
    predictedDecidedBy: DecisionMethod | null;
  }
) {
  const drafts = readPredictionDrafts();
  drafts[matchId] = {
    homeGoals,
    awayGoals,
    predictedWinnerTeamId: knockout?.predictedWinnerTeamId ?? null,
    predictedDecidedBy: knockout?.predictedDecidedBy ?? null,
    updatedAt: new Date().toISOString()
  };
  writePredictionDrafts(drafts);
}

export function removePredictionDraft(matchId: string) {
  const drafts = readPredictionDrafts();
  delete drafts[matchId];
  writePredictionDrafts(drafts);
}

export function removePredictionDrafts(matchIds: string[]) {
  const drafts = readPredictionDrafts();
  for (const matchId of matchIds) {
    delete drafts[matchId];
  }
  writePredictionDrafts(drafts);
}
