"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  saveBulkPredictionsAction,
  type BulkSaveResult
} from "@/actions/predictions.actions";
import { LOCKED_STATUSES } from "@/lib/constants";
import { formatDateTime } from "@/lib/date";
import { getMatchTeamLabel } from "@/lib/match-visibility";
import {
  readPredictionDrafts,
  removePredictionDrafts,
  upsertPredictionDraft
} from "@/lib/prediction-draft";
import type { Match, MatchPrediction } from "@/types/domain";

type ScoreState = {
  homeGoals: string;
  awayGoals: string;
};

type PalpitesWorkspaceProps = {
  matches: Match[];
  savedPredictions: Record<string, MatchPrediction>;
};

const initialBulkState: BulkSaveResult = {
  ok: false,
  saved: 0,
  unchanged: 0,
  skipped: 0
};

function isLocked(match: Match) {
  return (
    new Date(match.starts_at).getTime() <= Date.now() ||
    LOCKED_STATUSES.has(match.status.toUpperCase())
  );
}

function compactDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return formatDateTime(value);
  const day = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const time = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `${day}, ${time}`;
}

function stageChip(match: Match) {
  if (match.group_name) return match.group_name;
  return match.stage ?? "Jogo";
}

function toScoreState(
  matchId: string,
  saved?: MatchPrediction,
  drafts?: ReturnType<typeof readPredictionDrafts>
): ScoreState {
  const draft = drafts?.[matchId];
  if (draft) {
    return {
      homeGoals: String(draft.homeGoals),
      awayGoals: String(draft.awayGoals)
    };
  }

  if (saved) {
    return {
      homeGoals: String(saved.homeGoals),
      awayGoals: String(saved.awayGoals)
    };
  }

  return { homeGoals: "", awayGoals: "" };
}

function parseScore(value: string) {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 30) return null;
  return parsed;
}

export function PalpitesWorkspace({ matches, savedPredictions }: PalpitesWorkspaceProps) {
  const router = useRouter();
  const [bulkState, bulkAction, bulkPending] = useActionState(
    saveBulkPredictionsAction,
    initialBulkState
  );
  const [, startTransition] = useTransition();
  const draftsBootstrapped = useRef(false);
  const lastSubmittedIds = useRef<string[]>([]);
  const [scores, setScores] = useState<Record<string, ScoreState>>(() => {
    const drafts = readPredictionDrafts();
    return Object.fromEntries(
      matches.map((match) => [
        match.external_id,
        toScoreState(match.external_id, savedPredictions[match.external_id], drafts)
      ])
    );
  });

  useEffect(() => {
    if (draftsBootstrapped.current) return;
    draftsBootstrapped.current = true;
    const drafts = readPredictionDrafts();
    if (Object.keys(drafts).length === 0) return;

    setScores((current) => {
      const next = { ...current };
      for (const match of matches) {
        const draft = drafts[match.external_id];
        if (!draft) continue;
        next[match.external_id] = {
          homeGoals: String(draft.homeGoals),
          awayGoals: String(draft.awayGoals)
        };
      }
      return next;
    });
  }, [matches]);

  const groupedMatches = useMemo(() => {
    const groups = new Map<string, Match[]>();
    for (const match of matches) {
      const key = stageChip(match);
      const bucket = groups.get(key) ?? [];
      bucket.push(match);
      groups.set(key, bucket);
    }
    return [...groups.entries()];
  }, [matches]);

  const pendingCount = useMemo(() => {
    return matches.reduce((total, match) => {
      if (isLocked(match)) return total;
      const current = scores[match.external_id];
      const saved = savedPredictions[match.external_id];
      const home = parseScore(current?.homeGoals ?? "");
      const away = parseScore(current?.awayGoals ?? "");
      if (home === null || away === null) return total;
      if (saved && saved.homeGoals === home && saved.awayGoals === away) return total;
      return total + 1;
    }, 0);
  }, [matches, savedPredictions, scores]);

  function updateScore(matchId: string, side: "homeGoals" | "awayGoals", value: string) {
    setScores((current) => {
      const nextScore = {
        ...current[matchId],
        [side]: value
      };
      const home = parseScore(nextScore.homeGoals);
      const away = parseScore(nextScore.awayGoals);
      if (home !== null && away !== null) {
        upsertPredictionDraft(matchId, home, away);
      }
      return { ...current, [matchId]: nextScore };
    });
  }

  function handleSaveAll() {
    const predictions = matches.flatMap((match) => {
      if (isLocked(match)) return [];
      const current = scores[match.external_id];
      const home = parseScore(current?.homeGoals ?? "");
      const away = parseScore(current?.awayGoals ?? "");
      if (home === null || away === null) return [];

      const saved = savedPredictions[match.external_id];
      if (saved && saved.homeGoals === home && saved.awayGoals === away) return [];

      return [{ matchId: match.external_id, homeGoals: home, awayGoals: away }];
    });

    if (predictions.length === 0) return;

    lastSubmittedIds.current = predictions.map((prediction) => prediction.matchId);

    const formData = new FormData();
    formData.set("predictions", JSON.stringify(predictions));

    startTransition(() => {
      bulkAction(formData);
    });
  }

  useEffect(() => {
    if (bulkPending || !bulkState.ok) return;
    if (bulkState.saved === 0 && bulkState.unchanged === 0) return;
    if (lastSubmittedIds.current.length === 0) return;

    removePredictionDrafts(lastSubmittedIds.current);
    lastSubmittedIds.current = [];
    router.refresh();
  }, [bulkPending, bulkState, router]);

  return (
    <>
      {pendingCount > 0 ? (
        <p className="palpites-summary">
          <span className="palpites-summary__pending">
            {pendingCount} jogo{pendingCount === 1 ? "" : "s"} pronto
            {pendingCount === 1 ? "" : "s"} para salvar
          </span>
        </p>
      ) : null}

      {bulkState.error ? <p className="error">{bulkState.error}</p> : null}
      {bulkState.ok && bulkState.saved > 0 ? (
        <p className="success">
          {bulkState.saved} palpite{bulkState.saved === 1 ? "" : "s"} salvo
          {bulkState.saved === 1 ? "" : "s"}.
        </p>
      ) : null}

      <div className="palpites-groups">
        {groupedMatches.map(([groupLabel, groupMatches]) => (
          <section key={groupLabel} className="palpites-group">
            <header className="palpites-group__head">
              <h2>{groupLabel}</h2>
              <span>{groupMatches.length} jogos</span>
            </header>

            <div className="palpites-rows">
              {groupMatches.map((match) => {
                const locked = isLocked(match);
                const saved = savedPredictions[match.external_id];
                const current = scores[match.external_id] ?? { homeGoals: "", awayGoals: "" };
                const homeName = getMatchTeamLabel(match, "home");
                const awayName = getMatchTeamLabel(match, "away");

                return (
                  <article
                    key={match.external_id}
                    className={`palpite-row ${locked ? "palpite-row--locked" : ""}`}
                  >
                    <div className="palpite-row__meta">
                      <time>{compactDate(match.starts_at)}</time>
                      {locked ? <span className="badge locked">Fechado</span> : null}
                      {saved ? <span className="badge">Salvo</span> : null}
                      {saved?.points !== null && saved?.points !== undefined ? (
                        <span className="badge warning">{saved.points} pts</span>
                      ) : null}
                    </div>

                    <div className="palpite-row__match">
                      <div className="palpite-row__team">
                        {match.home_team?.flag_url ? (
                          <img src={match.home_team.flag_url} alt="" loading="lazy" />
                        ) : (
                          <span className="palpite-row__shield" aria-hidden="true" />
                        )}
                        <span>{homeName}</span>
                      </div>

                      <div className="palpite-row__score">
                        <input
                          aria-label={`Gols de ${homeName}`}
                          disabled={locked}
                          inputMode="numeric"
                          max={30}
                          min={0}
                          onChange={(event) =>
                            updateScore(match.external_id, "homeGoals", event.target.value)
                          }
                          type="number"
                          value={current.homeGoals}
                        />
                        <span>x</span>
                        <input
                          aria-label={`Gols de ${awayName}`}
                          disabled={locked}
                          inputMode="numeric"
                          max={30}
                          min={0}
                          onChange={(event) =>
                            updateScore(match.external_id, "awayGoals", event.target.value)
                          }
                          type="number"
                          value={current.awayGoals}
                        />
                      </div>

                      <div className="palpite-row__team palpite-row__team--away">
                        {match.away_team?.flag_url ? (
                          <img src={match.away_team.flag_url} alt="" loading="lazy" />
                        ) : (
                          <span className="palpite-row__shield" aria-hidden="true" />
                        )}
                        <span>{awayName}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="palpites-savebar">
        <strong>
          {pendingCount > 0
            ? `Salvar ${pendingCount} palpite${pendingCount === 1 ? "" : "s"}`
            : "Nada novo para salvar"}
        </strong>
        <button
          className="button"
          disabled={bulkPending || pendingCount === 0}
          onClick={handleSaveAll}
          type="button"
        >
          {bulkPending ? "Salvando..." : "Salvar agora"}
        </button>
      </div>
    </>
  );
}
