"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveMatchPredictionAction } from "@/actions/predictions.actions";
import { formatDateTime } from "@/lib/date";
import { isMatchLockedForPrediction } from "@/lib/match-lock";
import { getDisplayOfficialScore } from "@/lib/match-score";
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

function isSameLocalDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function isMatchToday(match: Match, now: number) {
  const startsAt = new Date(match.starts_at);
  if (Number.isNaN(startsAt.getTime())) return false;
  return isSameLocalDay(startsAt, new Date(now));
}

function todayHeading(now: number) {
  return dayHeading(new Date(now).toISOString());
}

function localDayKey(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dayHeading(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return formatDateTime(value);
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long"
  });
}

function sortMatchesByStart(a: Match, b: Match) {
  return (
    new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime() ||
    a.external_id.localeCompare(b.external_id)
  );
}

function sortDayGroups(
  left: [string, Match[]],
  right: [string, Match[]],
  todayKey: string
) {
  const leftIsPast = left[0] < todayKey;
  const rightIsPast = right[0] < todayKey;

  if (leftIsPast !== rightIsPast) {
    return leftIsPast ? 1 : -1;
  }

  return left[0].localeCompare(right[0]);
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

function statusLabel(matchId: string, locked: boolean, hasSaved: boolean, status?: RowStatus) {
  if (locked) return null;
  if (status === "saving") return <span className="badge">Salvando...</span>;
  if (status === "error") return <span className="badge locked">Erro ao salvar</span>;
  if (status === "saved" || hasSaved) return <span className="badge">Salvo</span>;
  return null;
}

function PalpiteMatchRow({
  match,
  now,
  saved,
  current,
  status,
  showGroupLabel,
  onUpdateScore
}: {
  match: Match;
  now: number;
  saved?: MatchPrediction;
  current: ScoreState;
  status?: RowStatus;
  showGroupLabel?: boolean;
  onUpdateScore: (match: Match, side: "homeGoals" | "awayGoals", value: string) => void;
}) {
  const locked = isMatchLockedForPrediction(match, now);
  const homeName = getMatchTeamLabel(match, "home");
  const awayName = getMatchTeamLabel(match, "away");
  const officialScore = getDisplayOfficialScore(match);

  return (
    <article className={`palpite-row ${locked ? "palpite-row--locked" : ""}`}>
      <div className="palpite-row__meta">
        <time>{compactDate(match.starts_at)}</time>
        {showGroupLabel ? <span className="badge">{stageChip(match)}</span> : null}
        {locked ? <span className="badge locked">Fechado</span> : null}
        {statusLabel(match.external_id, locked, Boolean(saved), status)}
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
          <div className="palpite-row__prediction">
            <span className="palpite-row__score-label">Palpite</span>
            <div className="palpite-row__prediction-inputs">
              <input
                aria-label={`Gols de ${homeName}`}
                disabled={locked}
                inputMode="numeric"
                max={30}
                min={0}
                onChange={(event) => onUpdateScore(match, "homeGoals", event.target.value)}
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
                onChange={(event) => onUpdateScore(match, "awayGoals", event.target.value)}
                type="number"
                value={current.awayGoals}
              />
            </div>
          </div>

          {officialScore ? (
            <div
              aria-label={`${officialScore.label}: ${officialScore.home} a ${officialScore.away}`}
              className="palpite-row__official"
            >
              <span className="palpite-row__score-label">{officialScore.label}</span>
              <strong>
                {officialScore.home} x {officialScore.away}
              </strong>
            </div>
          ) : null}
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
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    savedBaseline.current = savedPredictions;
  }, [savedPredictions]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;

    async function refreshLiveData() {
      try {
        const [matchesResponse, rankingResponse] = await Promise.all([
          fetch("/api/worldcup/matches", { cache: "no-store" }),
          fetch("/api/ranking", { cache: "no-store" })
        ]);

        if (!active) return;
        if (matchesResponse.ok || rankingResponse.ok) {
          router.refresh();
        }
      } catch {
        // Keep the last rendered snapshot on transient failures.
      }
    }

    void refreshLiveData();

    const timer = setInterval(() => {
      void refreshLiveData();
    }, 30_000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [router]);

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

  const todayMatches = useMemo(
    () => matches.filter((match) => isMatchToday(match, now)).sort(sortMatchesByStart),
    [matches, now]
  );

  const matchesByDay = useMemo(() => {
    const days = new Map<string, Match[]>();
    for (const match of matches) {
      if (isMatchToday(match, now)) continue;
      const key = localDayKey(match.starts_at);
      const bucket = days.get(key) ?? [];
      bucket.push(match);
      days.set(key, bucket);
    }

    const todayKey = localDayKey(new Date(now).toISOString());

    return [...days.entries()]
      .sort((left, right) => sortDayGroups(left, right, todayKey))
      .map(([dayKey, dayMatches]) => ({
        dayKey,
        heading: dayHeading(dayMatches[0]?.starts_at ?? dayKey),
        matches: dayMatches.sort(sortMatchesByStart)
      }));
  }, [matches, now]);

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

  return (
    <div className="palpites-groups">
      {todayMatches.length > 0 ? (
        <section className="palpites-group palpites-group--today">
          <header className="palpites-group__head">
            <div>
              <h2>Jogos de hoje</h2>
              <p className="palpites-group__subhead">{todayHeading(now)}</p>
            </div>
            <span>{todayMatches.length} jogos</span>
          </header>

          <div className="palpites-rows">
            {todayMatches.map((match) => (
              <PalpiteMatchRow
                key={`today-${match.external_id}`}
                current={scores[match.external_id] ?? { homeGoals: "", awayGoals: "" }}
                match={match}
                now={now}
                onUpdateScore={updateScore}
                saved={savedPredictions[match.external_id]}
                showGroupLabel
                status={rowStatus[match.external_id]}
              />
            ))}
          </div>
        </section>
      ) : null}

      {matchesByDay.map((day) => (
        <section key={day.dayKey} className="palpites-group">
          <header className="palpites-group__head">
            <div>
              <h2>{day.heading}</h2>
            </div>
            <span>{day.matches.length} jogos</span>
          </header>

          <div className="palpites-rows">
            {day.matches.map((match) => (
              <PalpiteMatchRow
                key={match.external_id}
                current={scores[match.external_id] ?? { homeGoals: "", awayGoals: "" }}
                match={match}
                now={now}
                onUpdateScore={updateScore}
                saved={savedPredictions[match.external_id]}
                showGroupLabel
                status={rowStatus[match.external_id]}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
