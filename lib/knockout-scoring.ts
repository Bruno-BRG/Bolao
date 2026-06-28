import { SCORING_RULES } from "@/lib/constants";
import type { DecisionMethod } from "@/lib/decision-method";

export type KnockoutMatchResult = {
  homeScore: number;
  awayScore: number;
  winnerTeamId: string | null;
  decidedBy: DecisionMethod | null;
  homeTeamId: string;
  awayTeamId: string;
  isKnockout: boolean;
};

export type KnockoutMatchPrediction = {
  predictedHomeScore: number;
  predictedAwayScore: number;
  predictedWinnerTeamId: string | null;
  predictedDecidedBy: DecisionMethod | null;
};

export type ScoreBreakdown = {
  pointsScore: number;
  pointsQualified: number;
  pointsMethod: number;
  totalPoints: number;
};

export function calculateMatchPredictionPoints(
  result: KnockoutMatchResult,
  prediction: KnockoutMatchPrediction
): ScoreBreakdown {
  let pointsScore = 0;
  let pointsQualified = 0;
  let pointsMethod = 0;

  const exactScore =
    result.homeScore === prediction.predictedHomeScore &&
    result.awayScore === prediction.predictedAwayScore;

  const realDraw = result.homeScore === result.awayScore;
  const predictedDraw =
    prediction.predictedHomeScore === prediction.predictedAwayScore;

  const realWinnerByScore =
    result.homeScore > result.awayScore
      ? result.homeTeamId
      : result.awayScore > result.homeScore
        ? result.awayTeamId
        : null;

  const predictedWinnerByScore =
    prediction.predictedHomeScore > prediction.predictedAwayScore
      ? result.homeTeamId
      : prediction.predictedAwayScore > prediction.predictedHomeScore
        ? result.awayTeamId
        : null;

  if (exactScore) {
    pointsScore = SCORING_RULES.exactScore;
  } else if (realDraw && predictedDraw) {
    pointsScore = SCORING_RULES.correctDraw;
  } else if (
    !realDraw &&
    predictedWinnerByScore !== null &&
    predictedWinnerByScore === realWinnerByScore
  ) {
    pointsScore = SCORING_RULES.correctWinner;
  }

  if (result.isKnockout) {
    if (
      prediction.predictedWinnerTeamId &&
      prediction.predictedWinnerTeamId === result.winnerTeamId
    ) {
      pointsQualified = SCORING_RULES.knockoutQualified;
    }

    if (
      prediction.predictedDecidedBy &&
      prediction.predictedDecidedBy === result.decidedBy
    ) {
      if (result.decidedBy === "REGULAR") {
        pointsMethod = SCORING_RULES.knockoutMethodRegular;
      } else if (result.decidedBy === "EXTRA_TIME") {
        pointsMethod = SCORING_RULES.knockoutMethodExtraTime;
      } else if (result.decidedBy === "PENALTIES") {
        pointsMethod = SCORING_RULES.knockoutMethodPenalties;
      }
    }
  }

  return {
    pointsScore,
    pointsQualified,
    pointsMethod,
    totalPoints: pointsScore + pointsQualified + pointsMethod
  };
}
