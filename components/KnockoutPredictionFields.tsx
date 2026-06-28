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

const METHOD_ICON: Record<DecisionMethod, string> = {
  REGULAR: "⏱",
  EXTRA_TIME: "⏳",
  PENALTIES: "🎯"
};

function parseGoals(value: string) {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function TeamChip({
  active,
  disabled,
  flagUrl,
  label,
  onClick
}: {
  active: boolean;
  disabled: boolean;
  flagUrl: string | null | undefined;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={`knk-chip${active ? " knk-chip--active" : ""}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {flagUrl ? (
        <img alt="" className="flag-icon flag-icon--sm" loading="lazy" src={flagUrl} />
      ) : (
        <span className="knk-chip__crest" aria-hidden="true" />
      )}
      <span>{label}</span>
    </button>
  );
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
  const methods = hasScore ? allowedDecisionMethods(home, away) : [];

  const inferredWinner =
    hasScore && match.home_team_id && match.away_team_id
      ? inferWinnerFromScore(home, away, match.home_team_id, match.away_team_id)
      : null;

  const homeName = match.home_team?.name ?? "Mandante";
  const awayName = match.away_team?.name ?? "Visitante";

  return (
    <div className="knk">
      {!hasScore ? (
        <p className="knk__hint muted">
          Preencha o placar (antes dos pênaltis) para definir classificado e forma de
          avanço.
        </p>
      ) : (
        <>
          <div className="knk__block">
            <span className="knk__label">Quem avança?</span>
            {isDraw ? (
              <div className="knk__chips">
                <TeamChip
                  active={predictedWinnerTeamId === match.home_team_id}
                  disabled={locked || !match.home_team_id}
                  flagUrl={match.home_team?.flag_url}
                  label={homeName}
                  onClick={() => match.home_team_id && onWinnerChange(match.home_team_id)}
                />
                <TeamChip
                  active={predictedWinnerTeamId === match.away_team_id}
                  disabled={locked || !match.away_team_id}
                  flagUrl={match.away_team?.flag_url}
                  label={awayName}
                  onClick={() => match.away_team_id && onWinnerChange(match.away_team_id)}
                />
              </div>
            ) : (
              <p className="knk__auto">
                <span className="knk__auto-dot" />
                {inferredWinner === match.home_team_id ? homeName : awayName}{" "}
                <span className="muted">avança pelo placar</span>
              </p>
            )}
          </div>

          <div className="knk__block">
            <span className="knk__label">Como avança?</span>
            <div className="knk__chips">
              {methods.map((method) => (
                <button
                  key={method}
                  aria-pressed={predictedDecidedBy === method}
                  className={`knk-chip${predictedDecidedBy === method ? " knk-chip--active" : ""}`}
                  disabled={locked}
                  onClick={() => onMethodChange(method)}
                  type="button"
                >
                  <span aria-hidden="true">{METHOD_ICON[method]}</span>
                  <span>{DECISION_METHOD_LABELS[method]}</span>
                </button>
              ))}
            </div>
            {isDraw ? (
              <p className="knk__tip muted">
                Empate no placar = decisão nos pênaltis. Escolha quem leva a melhor.
              </p>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
