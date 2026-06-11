const SCORING_RULES = {
  exactScore: 10,
  correctWinner: 7,
  correctDraw: 5
};

function getOutcome(homeGoals, awayGoals) {
  if (homeGoals > awayGoals) return "HOME";
  if (homeGoals < awayGoals) return "AWAY";
  return "DRAW";
}

function scoreMatchPrediction(prediction, match) {
  if (
    !prediction ||
    match.score_home === null ||
    match.score_away === null ||
    match.status !== "FINISHED"
  ) {
    return 0;
  }

  const predictedOutcome = getOutcome(prediction.homeGoals, prediction.awayGoals);
  const actualOutcome = getOutcome(match.score_home, match.score_away);
  const exactScore =
    prediction.homeGoals === match.score_home &&
    prediction.awayGoals === match.score_away;
  const correctOutcome = predictedOutcome === actualOutcome;

  if (exactScore) return SCORING_RULES.exactScore;
  if (actualOutcome === "DRAW" && predictedOutcome === "DRAW") {
    return SCORING_RULES.correctDraw;
  }
  if (correctOutcome) return SCORING_RULES.correctWinner;
  return 0;
}

const cases = [
  {
    name: "placar exato",
    prediction: { homeGoals: 2, awayGoals: 1 },
    match: { score_home: 2, score_away: 1, status: "FINISHED" },
    expected: 10
  },
  {
    name: "vencedor certo",
    prediction: { homeGoals: 2, awayGoals: 1 },
    match: { score_home: 4, score_away: 0, status: "FINISHED" },
    expected: 7
  },
  {
    name: "empate certo",
    prediction: { homeGoals: 0, awayGoals: 0 },
    match: { score_home: 2, score_away: 2, status: "FINISHED" },
    expected: 5
  },
  {
    name: "jogo ao vivo nao pontua",
    prediction: { homeGoals: 1, awayGoals: 0 },
    match: { score_home: 1, score_away: 0, status: "LIVE" },
    expected: 0
  },
  {
    name: "errou tudo",
    prediction: { homeGoals: 2, awayGoals: 0 },
    match: { score_home: 0, score_away: 2, status: "FINISHED" },
    expected: 0
  }
];

let failed = 0;
for (const testCase of cases) {
  const points = scoreMatchPrediction(testCase.prediction, testCase.match);
  const ok = points === testCase.expected;
  console.log(`${ok ? "OK" : "FAIL"} ${testCase.name}: ${points} (esperado ${testCase.expected})`);
  if (!ok) failed += 1;
}

process.exit(failed > 0 ? 1 : 0);
