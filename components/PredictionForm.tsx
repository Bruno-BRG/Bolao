"use client";

import { useState } from "react";
import { savePredictionAction } from "@/actions/predictions.actions";
import { LOCKED_STATUSES } from "@/lib/constants";
import { formatDateTime } from "@/lib/date";
import type { Match, MatchPrediction } from "@/types/domain";

function formatStatus(status: string, locked: boolean) {
  const normalized = status.toUpperCase();
  if (locked && !LOCKED_STATUSES.has(normalized)) return "Palpite fechado";

  const labels: Record<string, string> = {
    SCHEDULED: "Agendado",
    TIMED: "Agendado",
    LIVE: "Ao vivo",
    IN_PLAY: "Ao vivo",
    FINISHED: "Encerrado"
  };

  return labels[normalized] ?? status;
}

function TeamName({ name, flagUrl }: { name: string; flagUrl: string | null }) {
  return (
    <span className="team">
      {flagUrl ? (
        <img src={flagUrl} alt="" loading="lazy" />
      ) : (
        <span className="team-avatar">SEM</span>
      )}
      <span className="team-name">{name}</span>
    </span>
  );
}

export function PredictionForm({
  match,
  prediction
}: {
  match: Match;
  prediction?: MatchPrediction;
}) {
  const locked =
    new Date(match.starts_at).getTime() <= Date.now() ||
    LOCKED_STATUSES.has(match.status.toUpperCase());
  const payload = match.payload ?? {};
  const homeLabel =
    typeof payload.home_team_label === "string" ? payload.home_team_label : null;
  const awayLabel =
    typeof payload.away_team_label === "string" ? payload.away_team_label : null;
  const homeName = match.home_team?.name ?? homeLabel ?? "A definir";
  const awayName = match.away_team?.name ?? awayLabel ?? "A definir";
  const stageLabel =
    [match.stage ?? "Fase", match.group_name].filter(Boolean).join(" - ") || "Fase";
  const hasPrediction = Boolean(prediction);
  const [isEditing, setIsEditing] = useState(!hasPrediction);

  return (
    <form className="match-card" action={savePredictionAction}>
      <input type="hidden" name="matchId" value={match.external_id} />

      <div className="match-card__head">
        <div className="match-card__meta">
          <span className="eyebrow">{stageLabel}</span>
          <p className="muted">{formatDateTime(match.starts_at)}</p>
        </div>
        <span className={`badge ${locked ? "locked" : ""}`}>
          {formatStatus(match.status, locked)}
        </span>
      </div>

      <div className="match-card__body">
        <div className="team-block">
          <TeamName name={homeName} flagUrl={match.home_team?.flag_url ?? null} />
          <p className="muted">Mandante do confronto</p>
        </div>

        <div className="match-card__score">
          <strong>{hasPrediction && !isEditing ? "Palpite salvo" : "Seu placar"}</strong>
          {hasPrediction && !isEditing ? (
            <div className="saved-score">
              <span>{prediction?.homeGoals}</span>
              <strong>x</strong>
              <span>{prediction?.awayGoals}</span>
            </div>
          ) : (
            <div className="score-inputs">
              <input
                aria-label={`Gols de ${homeName}`}
                defaultValue={prediction?.homeGoals ?? ""}
                disabled={locked}
                max={30}
                min={0}
                name="homeGoals"
                required
                type="number"
              />
              <span>x</span>
              <input
                aria-label={`Gols de ${awayName}`}
                defaultValue={prediction?.awayGoals ?? ""}
                disabled={locked}
                max={30}
                min={0}
                name="awayGoals"
                required
                type="number"
              />
            </div>
          )}
        </div>

        <div className="team-block">
          <TeamName name={awayName} flagUrl={match.away_team?.flag_url ?? null} />
          <p className="muted">Visitante do confronto</p>
        </div>
      </div>

      <div className="match-card__footer">
        <div className="match-card__footer-meta">
          {match.score_home !== null && match.score_away !== null ? (
            <p className="badge warning">Oficial: {match.score_home} x {match.score_away}</p>
          ) : (
            <p className="muted">Aguardando resultado oficial.</p>
          )}
          {prediction?.points !== null && prediction?.points !== undefined ? (
            <p className="badge">{prediction.points} pts</p>
          ) : null}
          {prediction?.savedAt ? (
            <p className="muted">Ultima edicao: {formatDateTime(prediction.savedAt)}</p>
          ) : null}
        </div>

        {!locked ? (
          hasPrediction && !isEditing ? (
            <button
              className="button secondary"
              onClick={() => setIsEditing(true)}
              type="button"
            >
              Editar palpite
            </button>
          ) : (
            <div className="inline-actions">
              {hasPrediction ? (
                <button
                  className="button ghost"
                  onClick={() => setIsEditing(false)}
                  type="button"
                >
                  Cancelar
                </button>
              ) : null}
              <button className="button" disabled={locked} type="submit">
                {hasPrediction ? "Salvar alteracao" : "Salvar palpite"}
              </button>
            </div>
          )
        ) : null}
      </div>
    </form>
  );
}
