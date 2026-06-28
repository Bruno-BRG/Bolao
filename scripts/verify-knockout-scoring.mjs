const SCORING_RULES = {
  exactScore: 10,
  correctWinner: 7,
  correctDraw: 5,
  knockoutQualified: 5,
  knockoutMethodRegular: 2,
  knockoutMethodExtraTime: 3,
  knockoutMethodPenalties: 4
};

function calculateMatchPredictionPoints(result, prediction) {
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
      if (result.decidedBy === "REGULAR") pointsMethod = SCORING_RULES.knockoutMethodRegular;
      if (result.decidedBy === "EXTRA_TIME") pointsMethod = SCORING_RULES.knockoutMethodExtraTime;
      if (result.decidedBy === "PENALTIES") pointsMethod = SCORING_RULES.knockoutMethodPenalties;
    }
  }

  return {
    pointsScore,
    pointsQualified,
    pointsMethod,
    totalPoints: pointsScore + pointsQualified + pointsMethod
  };
}

function runTest(name, result, expected) {
  const ok =
    result.pointsScore === expected.pointsScore &&
    result.pointsQualified === expected.pointsQualified &&
    result.pointsMethod === expected.pointsMethod &&
    result.totalPoints === expected.totalPoints;
  console.log(
    `${ok ? "OK" : "FAIL"} ${name}: ${JSON.stringify(result)} (esperado ${JSON.stringify(expected)})`
  );
  return ok ? 0 : 1;
}

const home = "brasil";
const away = "argentina";

let failed = 0;

failed += runTest(
  "teste 1: placar exato e penaltis",
  calculateMatchPredictionPoints(
    {
      homeScore: 1,
      awayScore: 1,
      winnerTeamId: home,
      decidedBy: "PENALTIES",
      homeTeamId: home,
      awayTeamId: away,
      isKnockout: true
    },
    {
      predictedHomeScore: 1,
      predictedAwayScore: 1,
      predictedWinnerTeamId: home,
      predictedDecidedBy: "PENALTIES"
    }
  ),
  { pointsScore: 10, pointsQualified: 5, pointsMethod: 4, totalPoints: 19 }
);

failed += runTest(
  "teste 2: classificado correto, placar errado",
  calculateMatchPredictionPoints(
    {
      homeScore: 1,
      awayScore: 1,
      winnerTeamId: home,
      decidedBy: "PENALTIES",
      homeTeamId: home,
      awayTeamId: away,
      isKnockout: true
    },
    {
      predictedHomeScore: 2,
      predictedAwayScore: 1,
      predictedWinnerTeamId: home,
      predictedDecidedBy: "REGULAR"
    }
  ),
  { pointsScore: 0, pointsQualified: 5, pointsMethod: 0, totalPoints: 5 }
);

failed += runTest(
  "teste 3: vencedor no tempo normal",
  calculateMatchPredictionPoints(
    {
      homeScore: 2,
      awayScore: 0,
      winnerTeamId: home,
      decidedBy: "REGULAR",
      homeTeamId: home,
      awayTeamId: away,
      isKnockout: true
    },
    {
      predictedHomeScore: 3,
      predictedAwayScore: 1,
      predictedWinnerTeamId: home,
      predictedDecidedBy: "REGULAR"
    }
  ),
  { pointsScore: 7, pointsQualified: 5, pointsMethod: 2, totalPoints: 14 }
);

failed += runTest(
  "teste 4: empate correto, classificado errado",
  calculateMatchPredictionPoints(
    {
      homeScore: 1,
      awayScore: 1,
      winnerTeamId: home,
      decidedBy: "PENALTIES",
      homeTeamId: home,
      awayTeamId: away,
      isKnockout: true
    },
    {
      predictedHomeScore: 1,
      predictedAwayScore: 1,
      predictedWinnerTeamId: away,
      predictedDecidedBy: "PENALTIES"
    }
  ),
  { pointsScore: 10, pointsQualified: 0, pointsMethod: 4, totalPoints: 14 }
);

process.exit(failed > 0 ? 1 : 0);
