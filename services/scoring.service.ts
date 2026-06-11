import { FINISHED_STATUSES, SCORING_RULES } from "@/lib/constants";
import type { Match, PredictionDocument, Team } from "@/types/domain";
import { normalizePredictionDocument } from "@/services/prediction-document";

type OfficialTopFour = {
  first: string | null;
  second: string | null;
  third: string | null;
  fourth: string | null;
};

export function getOutcome(homeGoals: number, awayGoals: number) {
  if (homeGoals > awayGoals) return "HOME";
  if (homeGoals < awayGoals) return "AWAY";
  return "DRAW";
}

export function scoreMatchPrediction(match: Match, doc: PredictionDocument) {
  const prediction = doc.matches[match.external_id];

  if (
    !prediction ||
    match.score_home === null ||
    match.score_away === null ||
    !FINISHED_STATUSES.has(match.status)
  ) {
    return {
      points: 0,
      exactScore: false,
      correctOutcome: false,
      closeScores: 0
    };
  }

  const predictedOutcome = getOutcome(prediction.homeGoals, prediction.awayGoals);
  const actualOutcome = getOutcome(match.score_home, match.score_away);
  const exactScore =
    prediction.homeGoals === match.score_home &&
    prediction.awayGoals === match.score_away;
  const correctOutcome = predictedOutcome === actualOutcome;

  let points = 0;
  if (exactScore) {
    points = SCORING_RULES.exactScore;
  } else if (actualOutcome === "DRAW" && predictedOutcome === "DRAW") {
    points = SCORING_RULES.correctDraw;
  } else if (correctOutcome) {
    points = SCORING_RULES.correctWinner;
  }

  return {
    points,
    exactScore,
    correctOutcome,
    closeScores: 0
  };
}

export function scoreTopFourPrediction(
  doc: PredictionDocument,
  officialTopFour: OfficialTopFour
) {
  if (!doc.topFour) return 0;

  const official = [
    officialTopFour.first,
    officialTopFour.second,
    officialTopFour.third,
    officialTopFour.fourth
  ].filter(Boolean) as string[];

  if (official.length < 4) return 0;

  const predicted = [
    doc.topFour.first,
    doc.topFour.second,
    doc.topFour.third,
    doc.topFour.fourth
  ];

  return predicted.reduce((total, teamId, index) => {
    if (official[index] === teamId) {
      return total + SCORING_RULES.topFourExactPosition;
    }

    if (official.includes(teamId)) {
      return total + SCORING_RULES.topFourIncluded;
    }

    return total;
  }, 0);
}

export function resolveOfficialTopFour(teams: Team[]): OfficialTopFour {
  const ranked = teams
    .map((team) => {
      const payload = team as Team & { payload?: Record<string, unknown> };
      const finalPosition = Number(payload.payload?.final_position);
      return { id: team.external_id, finalPosition };
    })
    .filter((team) => Number.isInteger(team.finalPosition))
    .sort((a, b) => a.finalPosition - b.finalPosition);

  return {
    first: ranked.find((team) => team.finalPosition === 1)?.id ?? null,
    second: ranked.find((team) => team.finalPosition === 2)?.id ?? null,
    third: ranked.find((team) => team.finalPosition === 3)?.id ?? null,
    fourth: ranked.find((team) => team.finalPosition === 4)?.id ?? null
  };
}

export function calculatePredictionScore(
  rawDocument: unknown,
  matches: Match[],
  teams: Team[]
) {
  const doc = normalizePredictionDocument(rawDocument);
  const calculatedAt = new Date().toISOString();
  const nextMatches = { ...doc.matches };
  let matchPoints = 0;
  let exactScores = 0;
  let correctOutcomes = 0;
  let closeScores = 0;

  for (const match of matches) {
    const result = scoreMatchPrediction(match, doc);
    if (nextMatches[match.external_id]) {
      nextMatches[match.external_id] = {
        ...nextMatches[match.external_id],
        locked: FINISHED_STATUSES.has(match.status),
        points: FINISHED_STATUSES.has(match.status) ? result.points : null
      };
    }
    matchPoints += result.points;
    if (result.exactScore) exactScores += 1;
    if (result.correctOutcome) correctOutcomes += 1;
    closeScores += result.closeScores;
  }

  const topFourPoints = scoreTopFourPrediction(doc, resolveOfficialTopFour(teams));
  const blanks = matches.filter((match) => !doc.matches[match.external_id]).length;
  const totalPoints = matchPoints + topFourPoints;

  const nextDoc: PredictionDocument = {
    ...doc,
    updatedAt: calculatedAt,
    matches: nextMatches,
    topFour: doc.topFour ? { ...doc.topFour, points: topFourPoints } : null,
    summary: {
      totalPoints,
      matchPoints,
      topFourPoints,
      exactScores,
      correctOutcomes,
      closeScores,
      blanks,
      lastCalculatedAt: calculatedAt
    }
  };

  return nextDoc;
}
