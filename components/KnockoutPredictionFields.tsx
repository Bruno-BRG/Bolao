"use client";

import {
  DECISION_METHOD_LABELS,
  type DecisionMethod
} from "@/lib/decision-method";
import {
  allowedDecisionMethods,
  inferWinnerFromScore
} from "@/lib/knockout-prediction-validation";
import type { Match } from "@/types/domain";

type KnockoutPredictionFieldsProps = {
  match: Match;
  homeGoals: string;
  awayGoals: string;
  predictedWinnerTeamId: string | null;
  predictedDecidedBy: DecisionMethod | null;
  locked: boolean;
  onWinnerChange: (teamId: string) => void;
  onMethodChange: (method: DecisionMethod) => void;
};

function parseGoals(value: string) {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

export function KnockoutPredictionFields({
  match,
  homeGoals,
  awayGoals,
  predictedWinnerTeamId,
  predictedDecidedBy,
  locked,
  onWinnerChange,
  onMethodChange
}: KnockoutPredictionFieldsProps) {
  const home = parseGoals(homeGoals);
  const away = parseGoals(awayGoals);
  const hasScore = home !== null && away !== null;
  const isDraw = hasScore && home === away;
  const inferredWinner =
    hasScore && match.home_team_id && match.away_team_id
      ? inferWinnerFromScore(home, away, match.home_team_id, match.away_team_id)
      : null;

  const methods = hasScore ? allowedDecisionMethods(home, away) : [];

  return (
    <div className="knockout-prediction">
      <p className="knockout-prediction__hint muted">
        No mata-mata, o placar e antes dos penaltis. Empate + penaltis: escolha quem
        classifica.
      </p>

      {hasScore ? (
        <>
          <fieldset className="knockout-prediction__group" disabled={locked}>
            <legend>Quem classifica?</legend>
            {isDraw ? (
              <div className="knockout-prediction__options">
                <label>
                  <input
                    checked={predictedWinnerTeamId === match.home_team_id}
                    name={`winner-${match.external_id}`}
                    onChange={() =>
                      match.home_team_id && onWinnerChange(match.home_team_id)
                    }
                    type="radio"
                  />
                  {match.home_team?.name ?? "Mandante"}
                </label>
                <label>
                  <input
                    checked={predictedWinnerTeamId === match.away_team_id}
                    name={`winner-${match.external_id}`}
                    onChange={() =>
                      match.away_team_id && onWinnerChange(match.away_team_id)
                    }
                    type="radio"
                  />
                  {match.away_team?.name ?? "Visitante"}
                </label>
              </div>
            ) : (
              <p className="muted">
                {inferredWinner === match.home_team_id
                  ? (match.home_team?.name ?? "Mandante")
                  : (match.away_team?.name ?? "Visitante")}{" "}
                (automatico pelo placar)
              </p>
            )}
          </fieldset>

          <fieldset className="knockout-prediction__group" disabled={locked}>
            <legend>Como classifica?</legend>
            <div className="knockout-prediction__options">
              {methods.map((method) => (
                <label key={method}>
                  <input
                    checked={predictedDecidedBy === method}
                    name={`method-${match.external_id}`}
                    onChange={() => onMethodChange(method)}
                    type="radio"
                  />
                  {DECISION_METHOD_LABELS[method]}
                </label>
              ))}
            </div>
          </fieldset>
        </>
      ) : (
        <p className="muted">Preencha o placar para escolher classificado e forma.</p>
      )}
    </div>
  );
}
