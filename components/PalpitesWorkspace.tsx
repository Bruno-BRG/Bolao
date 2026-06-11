"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveMatchPredictionAction } from "@/actions/predictions.actions";
import { formatDateTime } from "@/lib/date";
import { isMatchLockedForPrediction } from "@/lib/match-lock";
import { getMatchTeamLabel } from "@/lib/match-visibility";
import {
  readPredictionDrafts,
  removePredictionDraft,
  upsertPredictionDraft
} from "@/lib/prediction-draft";
import type { Match, MatchPrediction } from "@/types/domain";

type ScoreState = {
  homeGoals: string;
  awayGoals: string;
};

type RowStatus = "idle" | "saving" | "saved" | "error";

type PalpitesWorkspaceProps = {
  matches: Match[];
  savedPredictions: Record<string, MatchPrediction>;
};

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
  const draftsBootstrapped = useRef(false);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const savedBaseline = useRef(savedPredictions);
  const [scores, setScores] = useState<Record<string, ScoreState>>(() => {
    const drafts = readPredictionDrafts();
    return Object.fromEntries(
      matches.map((match) => [
        match.external_id,
        toScoreState(match.external_id, savedPredictions[match.external_id], drafts)
      ])
    );
  });
  const [rowStatus, setRowStatus] = useState<Record<string, RowStatus>>({});

  useEffect(() => {
    savedBaseline.current = savedPredictions;
  }, [savedPredictions]);

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

  useEffect(() => {
    return () => {
      for (const timer of Object.values(saveTimers.current)) {
        clearTimeout(timer);
      }
    };
  }, []);

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

  async function persistMatch(
    match: Match,
    homeGoals: number,
    awayGoals: number
  ) {
    const matchId = match.external_id;
    const saved = savedBaseline.current[matchId];
    if (saved && saved.homeGoals === homeGoals && saved.awayGoals === awayGoals) {
      setRowStatus((current) => ({ ...current, [matchId]: "saved" }));
      return;
    }

    setRowStatus((current) => ({ ...current, [matchId]: "saving" }));

    const result = await saveMatchPredictionAction({
      matchId,
      homeGoals,
      awayGoals
    });

    if (result.ok) {
      removePredictionDraft(matchId);
      setRowStatus((current) => ({ ...current, [matchId]: "saved" }));
      router.refresh();
      return;
    }

    setRowStatus((current) => ({ ...current, [matchId]: "error" }));
  }

  function scheduleAutoSave(match: Match, nextScore: ScoreState) {
    const matchId = match.external_id;
    if (isMatchLockedForPrediction(match)) return;

    const home = parseScore(nextScore.homeGoals);
    const away = parseScore(nextScore.awayGoals);
    if (home === null || away === null) {
      setRowStatus((current) => ({ ...current, [matchId]: "idle" }));
      return;
    }

    upsertPredictionDraft(matchId, home, away);
    setRowStatus((current) => ({ ...current, [matchId]: "idle" }));

    if (saveTimers.current[matchId]) {
      clearTimeout(saveTimers.current[matchId]);
    }

    saveTimers.current[matchId] = setTimeout(() => {
      void persistMatch(match, home, away);
    }, 700);
  }

  function updateScore(match: Match, side: "homeGoals" | "awayGoals", value: string) {
    setScores((current) => {
      const nextScore = {
        ...current[match.external_id],
        [side]: value
      };
      const next = { ...current, [match.external_id]: nextScore };
      scheduleAutoSave(match, nextScore);
      return next;
    });
  }

  function statusLabel(matchId: string, locked: boolean, hasSaved: boolean) {
    if (locked) return null;
    const status = rowStatus[matchId];
    if (status === "saving") return <span className="badge">Salvando...</span>;
    if (status === "error") return <span className="badge locked">Erro ao salvar</span>;
    if (status === "saved" || hasSaved) return <span className="badge">Salvo</span>;
    return null;
  }

  return (
    <div className="palpites-groups">
      {groupedMatches.map(([groupLabel, groupMatches]) => (
        <section key={groupLabel} className="palpites-group">
          <header className="palpites-group__head">
            <h2>{groupLabel}</h2>
            <span>{groupMatches.length} jogos</span>
          </header>

          <div className="palpites-rows">
            {groupMatches.map((match) => {
              const locked = isMatchLockedForPrediction(match);
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
                    {statusLabel(match.external_id, locked, Boolean(saved))}
                    {saved?.points !== null && saved?.points !== undefined ? (
                      <span className="badge warning">{saved.points} pts</span>
                    ) : null}
                  </div>

                  <div className="palpite-row__match">
                    <div className="palpite-row__team">
                      {match.home_team?.flag_url ? (
                        <img
                          className="flag-icon flag-icon--sm"
                          src={match.home_team.flag_url}
                          alt=""
                          loading="lazy"
                        />
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
                          updateScore(match, "homeGoals", event.target.value)
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
                          updateScore(match, "awayGoals", event.target.value)
                        }
                        type="number"
                        value={current.awayGoals}
                      />
                    </div>

                    <div className="palpite-row__team palpite-row__team--away">
                      {match.away_team?.flag_url ? (
                        <img
                          className="flag-icon flag-icon--sm"
                          src={match.away_team.flag_url}
                          alt=""
                          loading="lazy"
                        />
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
  );
}
