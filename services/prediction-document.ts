import { TOURNAMENT_CODE } from "@/lib/constants";
import type { PredictionDocument } from "@/types/domain";

export function createEmptyPredictionDocument(): PredictionDocument {
  return {
    version: 2,
    tournamentCode: TOURNAMENT_CODE,
    updatedAt: new Date().toISOString(),
    matches: {},
    topFour: null,
    bracket: null,
    summary: {
      totalPoints: 0,
      matchPoints: 0,
      knockoutPoints: 0,
      topFourPoints: 0,
      bracketPoints: 0,
      exactScores: 0,
      correctOutcomes: 0,
      closeScores: 0,
      blanks: 0,
      lastCalculatedAt: null
    }
  };
}

export function normalizePredictionDocument(value: unknown): PredictionDocument {
  const fallback = createEmptyPredictionDocument();

  if (!value || typeof value !== "object") {
    return fallback;
  }

  const candidate = value as Partial<PredictionDocument>;

  return {
    ...fallback,
    ...candidate,
    version: 2,
    tournamentCode: candidate.tournamentCode ?? TOURNAMENT_CODE,
    matches:
      candidate.matches && typeof candidate.matches === "object"
        ? candidate.matches
        : {},
    topFour: candidate.topFour ?? null,
    bracket: candidate.bracket ?? null,
    summary: {
      ...fallback.summary,
      ...(candidate.summary ?? {})
    }
  };
}
