import type { DecisionMethod } from "@/lib/decision-method";

export type KnockoutPredictionInput = {
  homeGoals: number;
  awayGoals: number;
  predictedWinnerTeamId: string | null;
  predictedDecidedBy: DecisionMethod | null;
  homeTeamId: string;
  awayTeamId: string;
};

export function inferWinnerFromScore(
  homeGoals: number,
  awayGoals: number,
  homeTeamId: string,
  awayTeamId: string
): string | null {
  if (homeGoals > awayGoals) return homeTeamId;
  if (awayGoals > homeGoals) return awayTeamId;
  return null;
}

export function allowedDecisionMethods(
  homeGoals: number,
  awayGoals: number
): DecisionMethod[] {
  if (homeGoals === awayGoals) return ["PENALTIES"];
  return ["REGULAR", "EXTRA_TIME"];
}

export function validateKnockoutPrediction(input: KnockoutPredictionInput): string | null {
  const isDraw = input.homeGoals === input.awayGoals;
  const inferredWinner = inferWinnerFromScore(
    input.homeGoals,
    input.awayGoals,
    input.homeTeamId,
    input.awayTeamId
  );

  if (!isDraw) {
    if (
      input.predictedWinnerTeamId &&
      input.predictedWinnerTeamId !== inferredWinner
    ) {
      return "O classificado deve ser o vencedor do placar previsto.";
    }
    if (input.predictedDecidedBy === "PENALTIES") {
      return "Penaltis so pode ser escolhido quando o placar previsto for empate.";
    }
    if (!input.predictedDecidedBy) {
      return "Escolha como o time classifica (tempo normal ou prorrogacao).";
    }
    return null;
  }

  if (!input.predictedWinnerTeamId) {
    return "Em empate, escolha quem classifica.";
  }
  if (
    input.predictedWinnerTeamId !== input.homeTeamId &&
    input.predictedWinnerTeamId !== input.awayTeamId
  ) {
    return "Classificado invalido para este confronto.";
  }
  if (input.predictedDecidedBy !== "PENALTIES") {
    return "Em empate, a classificacao deve ser por penaltis.";
  }

  return null;
}

export function normalizeKnockoutPrediction(input: KnockoutPredictionInput) {
  const inferredWinner = inferWinnerFromScore(
    input.homeGoals,
    input.awayGoals,
    input.homeTeamId,
    input.awayTeamId
  );
  const isDraw = input.homeGoals === input.awayGoals;

  let predictedDecidedBy = input.predictedDecidedBy;
  if (!predictedDecidedBy) {
    predictedDecidedBy = isDraw ? "PENALTIES" : "REGULAR";
  }

  return {
    predictedWinnerTeamId: inferredWinner ?? input.predictedWinnerTeamId,
    predictedDecidedBy
  };
}

/** Fills winner/method defaults used by client autosave and server persist. */
export function resolveKnockoutPredictionFields(
  input: KnockoutPredictionInput
): { predictedWinnerTeamId: string | null; predictedDecidedBy: DecisionMethod | null } {
  const inferredWinner = inferWinnerFromScore(
    input.homeGoals,
    input.awayGoals,
    input.homeTeamId,
    input.awayTeamId
  );
  const isDraw = input.homeGoals === input.awayGoals;

  let predictedWinnerTeamId = inferredWinner ?? input.predictedWinnerTeamId;
  let predictedDecidedBy = input.predictedDecidedBy;

  if (!predictedDecidedBy) {
    const methods = allowedDecisionMethods(input.homeGoals, input.awayGoals);
    predictedDecidedBy =
      methods.length === 1 ? methods[0] : isDraw ? "PENALTIES" : "REGULAR";
  }

  if (isDraw && !predictedWinnerTeamId) {
    predictedWinnerTeamId = input.predictedWinnerTeamId;
  }

  return { predictedWinnerTeamId, predictedDecidedBy };
}
