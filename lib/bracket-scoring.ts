import { KNOCKOUT_ROUNDS } from "@/lib/knockout-bracket-tree";
import { isKnockoutStage } from "@/lib/knockout-stages";
import { isMatchFinished } from "@/lib/match-status";
import { getMatchWinnerTeamId } from "@/lib/match-knockout";
import type { Match } from "@/types/domain";

export type BracketSlotPick = {
  slot: string;
  teamId: string;
};

export type BracketTopFourPick = {
  position: number;
  teamId: string;
};

export type UserBracketPrediction = {
  quarterFinals: BracketSlotPick[];
  semiFinals: BracketSlotPick[];
  final: BracketSlotPick[];
  championTeamId: string | null;
  runnerUpTeamId: string | null;
  top4: BracketTopFourPick[];
};

export type OfficialBracket = {
  quarterFinalists: string[];
  semiFinalists: string[];
  finalists: string[];
  championTeamId: string | null;
  runnerUpTeamId: string | null;
  top4: string[];
};

export type BracketPointsBreakdown = {
  pointsQuarterFinalists: number;
  pointsSemiFinalists: number;
  pointsFinalists: number;
  pointsChampion: number;
  pointsRunnerUp: number;
  pointsTop4: number;
  totalPoints: number;
};

function stageTitleForRound(roundId: string) {
  return KNOCKOUT_ROUNDS.find((round) => round.id === roundId)?.title ?? null;
}

function winnersFromRound(matches: Match[], roundTitle: string) {
  const winners: string[] = [];
  for (const match of matches) {
    if (match.stage !== roundTitle || !isMatchFinished(match)) continue;
    const winner = getMatchWinnerTeamId(match);
    if (winner) winners.push(winner);
  }
  return winners;
}

export function resolveOfficialBracket(matches: Match[]): OfficialBracket {
  const knockout = matches.filter((match) => isKnockoutStage(match.stage));
  const quarterTitle = stageTitleForRound("qf") ?? "Quartas";
  const semiTitle = stageTitleForRound("sf") ?? "Semifinal";
  const finalTitle = stageTitleForRound("final") ?? "Final";

  const quarterFinalists = winnersFromRound(knockout, stageTitleForRound("r16") ?? "Oitavas");
  const semiFinalists = winnersFromRound(knockout, quarterTitle);
  const finalists = winnersFromRound(knockout, semiTitle);

  const finalMatch = knockout.find(
    (match) => match.stage === finalTitle && isMatchFinished(match)
  );
  const thirdMatch = knockout.find(
    (match) => match.stage === "Terceiro lugar" && isMatchFinished(match)
  );

  const championTeamId = finalMatch ? getMatchWinnerTeamId(finalMatch) : null;
  let runnerUpTeamId: string | null = null;
  if (finalMatch && championTeamId) {
    const loser =
      finalMatch.home_team_id === championTeamId
        ? finalMatch.away_team_id
        : finalMatch.home_team_id;
    runnerUpTeamId = loser;
  }

  const top4: string[] = [];
  if (championTeamId) top4.push(championTeamId);
  if (runnerUpTeamId) top4.push(runnerUpTeamId);
  if (thirdMatch) {
    const thirdWinner = getMatchWinnerTeamId(thirdMatch);
    const thirdLoser =
      thirdMatch.home_team_id === thirdWinner
        ? thirdMatch.away_team_id
        : thirdMatch.home_team_id;
    if (thirdWinner) top4.push(thirdWinner);
    if (thirdLoser) top4.push(thirdLoser);
  }

  return {
    quarterFinalists,
    semiFinalists,
    finalists,
    championTeamId,
    runnerUpTeamId,
    top4: top4.slice(0, 4)
  };
}

function countSetOverlap(predicted: string[], official: string[]) {
  const officialSet = new Set(official);
  return predicted.filter((teamId) => officialSet.has(teamId)).length;
}

function topFourFromPrediction(prediction: UserBracketPrediction) {
  if (prediction.top4.length === 4) {
    return [...prediction.top4]
      .sort((a, b) => a.position - b.position)
      .map((entry) => entry.teamId);
  }

  const ordered = [
    prediction.championTeamId,
    prediction.runnerUpTeamId,
    prediction.top4.find((entry) => entry.position === 3)?.teamId ?? null,
    prediction.top4.find((entry) => entry.position === 4)?.teamId ?? null
  ].filter(Boolean) as string[];

  return ordered;
}

export function calculateBracketPoints(
  official: OfficialBracket,
  prediction: UserBracketPrediction
): BracketPointsBreakdown {
  const predictedQuarter = prediction.quarterFinals.map((slot) => slot.teamId);
  const predictedSemi = prediction.semiFinals.map((slot) => slot.teamId);
  const predictedFinal = prediction.final.map((slot) => slot.teamId);
  const predictedTop4 = topFourFromPrediction(prediction);

  const pointsQuarterFinalists =
    countSetOverlap(predictedQuarter, official.quarterFinalists) * 4;
  const pointsSemiFinalists =
    countSetOverlap(predictedSemi, official.semiFinalists) * 7;
  const pointsFinalists =
    countSetOverlap(predictedFinal, official.finalists) * 12;

  const pointsChampion =
    prediction.championTeamId &&
    prediction.championTeamId === official.championTeamId
      ? 25
      : 0;
  const pointsRunnerUp =
    prediction.runnerUpTeamId &&
    prediction.runnerUpTeamId === official.runnerUpTeamId
      ? 12
      : 0;

  let pointsTop4 = 0;
  if (official.top4.length === 4 && predictedTop4.length === 4) {
    const sameSet =
      predictedTop4.every((teamId) => official.top4.includes(teamId)) &&
      official.top4.every((teamId) => predictedTop4.includes(teamId));
    if (sameSet) {
      const exactOrder = predictedTop4.every(
        (teamId, index) => teamId === official.top4[index]
      );
      pointsTop4 = exactOrder ? 40 : 20;
    }
  }

  return {
    pointsQuarterFinalists,
    pointsSemiFinalists,
    pointsFinalists,
    pointsChampion,
    pointsRunnerUp,
    pointsTop4,
    totalPoints:
      pointsQuarterFinalists +
      pointsSemiFinalists +
      pointsFinalists +
      pointsChampion +
      pointsRunnerUp +
      pointsTop4
  };
}

export function getFirstKnockoutRoundStart(matches: Match[]) {
  const oitavasTitle = stageTitleForRound("r16") ?? "Oitavas";
  const oitavasIds = new Set(
    KNOCKOUT_ROUNDS.find((round) => round.id === "r16")?.matchIds ?? []
  );

  const candidates = matches
    .filter(
      (match) =>
        match.stage === oitavasTitle || oitavasIds.has(match.external_id)
    )
    .map((match) => new Date(match.starts_at).getTime())
    .filter((time) => !Number.isNaN(time));

  if (candidates.length === 0) return null;
  return new Date(Math.min(...candidates)).toISOString();
}

export function isBracketLocked(matches: Match[], now = Date.now()) {
  const firstStart = getFirstKnockoutRoundStart(matches);
  if (!firstStart) return false;
  return now >= new Date(firstStart).getTime();
}
