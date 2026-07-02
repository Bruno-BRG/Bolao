"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveMatchPredictionAction } from "@/actions/predictions.actions";
import { KnockoutPredictionFields } from "@/components/KnockoutPredictionFields";
import { formatCompactDateTime, formatDayHeading, appLocalDayKey, isSameAppDay } from "@/lib/date";
import type { DecisionMethod } from "@/lib/decision-method";
import { isKnockoutMatch } from "@/lib/match-knockout";
import {
  allowedDecisionMethods,
  resolveKnockoutPredictionFields
} from "@/lib/knockout-prediction-validation";
import { isMatchLockedForPrediction } from "@/lib/match-lock";
import { getDisplayOfficialScore } from "@/lib/match-score";
import { isMatchLive } from "@/lib/match-status";
import { getMatchTeamLabel, isMatchPredictable } from "@/lib/match-visibility";
import {
  readPredictionDrafts,
  removePredictionDraft,
  upsertPredictionDraft
} from "@/lib/prediction-draft";
import type { Match, MatchPrediction } from "@/types/domain";

type ScoreState = {
  homeGoals: string;
  awayGoals: string;
  predictedWinnerTeamId: string | null;
  predictedDecidedBy: DecisionMethod | null;
};

type RowStatus = "idle" | "saving" | "saved" | "error";

type RowError = string | null;

type PalpitesWorkspaceProps = {
  matches: Match[];
  savedPredictions: Record<string, MatchPrediction>;
};

function stageChip(match: Match) {
  if (match.group_name) return match.group_name;
  return match.stage ?? "Jogo";
}

function isMatchToday(match: Match, now: number) {
  const startsAt = new Date(match.starts_at);
  if (Number.isNaN(startsAt.getTime())) return false;
  return isSameAppDay(startsAt, now);
}

function todayHeading(now: number) {
  return formatDayHeading(new Date(now).toISOString());
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

function toScoreState(matchId: string, saved?: MatchPrediction): ScoreState {
  if (saved) {
    return {
      homeGoals: String(saved.homeGoals),
      awayGoals: String(saved.awayGoals),
      predictedWinnerTeamId: saved.predictedWinnerTeamId ?? null,
      predictedDecidedBy: saved.predictedDecidedBy ?? null
    };
  }

  return {
    homeGoals: "",
    awayGoals: "",
    predictedWinnerTeamId: null,
    predictedDecidedBy: null
  };
}

function parseScore(value: string) {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 30) return null;
  return parsed;
}

function statusLabel(
  locked: boolean,
  hasSaved: boolean,
  status?: RowStatus,
  errorMessage?: RowError
) {
  if (locked) return null;
  if (status === "saving") return <span className="badge">Salvando...</span>;
  if (status === "error") {
    return (
      <span className="badge locked" title={errorMessage ?? undefined}>
        Erro ao salvar
      </span>
    );
  }
  if (status === "saved" || hasSaved) return <span className="badge">Salvo</span>;
  return null;
}

function PalpiteMatchRow({
  match,
  now,
  saved,
  current,
  status,
  errorMessage,
  showGroupLabel,
  onUpdateScore,
  onWinnerChange,
  onMethodChange
}: {
  match: Match;
  now: number;
  saved?: MatchPrediction;
  current: ScoreState;
  status?: RowStatus;
  errorMessage?: RowError;
  showGroupLabel?: boolean;
  onUpdateScore: (match: Match, side: "homeGoals" | "awayGoals", value: string) => void;
  onWinnerChange: (match: Match, teamId: string) => void;
  onMethodChange: (match: Match, method: DecisionMethod) => void;
}) {
  const locked = isMatchLockedForPrediction(match, now) || !isMatchPredictable(match);
  const live = isMatchLive(match);
  const knockout = isKnockoutMatch(match);
  const homeName = getMatchTeamLabel(match, "home");
  const awayName = getMatchTeamLabel(match, "away");
  const officialScore = getDisplayOfficialScore(match);

  return (
    <article
      className={`palpite-row ${locked ? "palpite-row--locked" : ""} ${live ? "palpite-row--live" : ""}`}
    >
      <div className="palpite-row__meta">
        <time>{formatCompactDateTime(match.starts_at)}</time>
        {showGroupLabel ? <span className="badge">{stageChip(match)}</span> : null}
        {live ? <span className="badge live">Ao vivo</span> : null}
        {!isMatchPredictable(match) ? (
          <span className="badge locked">Aguardando adversário</span>
        ) : null}
        {locked && isMatchPredictable(match) ? (
          <span className="badge locked">Fechado</span>
        ) : null}
        {statusLabel(locked, Boolean(saved), status, errorMessage)}
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

      {knockout ? (
        <KnockoutPredictionFields
          awayGoals={current.awayGoals}
          homeGoals={current.homeGoals}
          locked={locked}
          match={match}
          onMethodChange={(method) => onMethodChange(match, method)}
          onWinnerChange={(teamId) => onWinnerChange(match, teamId)}
          predictedDecidedBy={current.predictedDecidedBy}
          predictedWinnerTeamId={current.predictedWinnerTeamId}
        />
      ) : null}
    </article>
  );
}

export function PalpitesWorkspace({ matches, savedPredictions }: PalpitesWorkspaceProps) {
  const router = useRouter();
  const draftsBootstrapped = useRef(false);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const inFlightSaves = useRef<Set<string>>(new Set());
  const pendingSaves = useRef<Record<string, ScoreState>>({});
  const savedBaseline = useRef(savedPredictions);
  const [scores, setScores] = useState<Record<string, ScoreState>>(() =>
    Object.fromEntries(
      matches.map((match) => [
        match.external_id,
        toScoreState(match.external_id, savedPredictions[match.external_id])
      ])
    )
  );
  const [rowStatus, setRowStatus] = useState<Record<string, RowStatus>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, RowError>>({});
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const previousBaseline = savedBaseline.current;
    savedBaseline.current = savedPredictions;

    setScores((current) => {
      let changed = false;
      const next = { ...current };

      for (const [matchId, saved] of Object.entries(savedPredictions)) {
        const baseline = previousBaseline[matchId];
        const local = current[matchId];
        if (!local || !baseline) continue;

        const localMatchesBaseline =
          String(baseline.homeGoals) === local.homeGoals &&
          String(baseline.awayGoals) === local.awayGoals &&
          (baseline.predictedWinnerTeamId ?? null) === local.predictedWinnerTeamId &&
          (baseline.predictedDecidedBy ?? null) === local.predictedDecidedBy;

        if (localMatchesBaseline) {
          next[matchId] = toScoreState(matchId, saved);
          changed = true;
        }
      }

      return changed ? next : current;
    });
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
          awayGoals: String(draft.awayGoals),
          predictedWinnerTeamId:
            draft.predictedWinnerTeamId ??
            savedPredictions[match.external_id]?.predictedWinnerTeamId ??
            null,
          predictedDecidedBy:
            draft.predictedDecidedBy ??
            savedPredictions[match.external_id]?.predictedDecidedBy ??
            null
        };
      }
      return next;
    });
  }, [matches, savedPredictions]);

  const flushDraftRef = useRef(false);

  useEffect(() => {
    return () => {
      for (const timer of Object.values(saveTimers.current)) {
        clearTimeout(timer);
      }
    };
  }, []);

  const liveMatches = useMemo(
    () => matches.filter((match) => isMatchLive(match)).sort(sortMatchesByStart),
    [matches]
  );

  const todayMatches = useMemo(
    () =>
      matches
        .filter((match) => isMatchToday(match, now) && !isMatchLive(match))
        .sort(sortMatchesByStart),
    [matches, now]
  );

  const matchesByDay = useMemo(() => {
    const days = new Map<string, Match[]>();
    for (const match of matches) {
      if (isMatchToday(match, now) || isMatchLive(match)) continue;
      const key = appLocalDayKey(match.starts_at);
      const bucket = days.get(key) ?? [];
      bucket.push(match);
      days.set(key, bucket);
    }

    const todayKey = appLocalDayKey(now);

    return [...days.entries()]
      .sort((left, right) => sortDayGroups(left, right, todayKey))
      .map(([dayKey, dayMatches]) => ({
        dayKey,
        heading: formatDayHeading(dayMatches[0]?.starts_at ?? dayKey),
        matches: dayMatches.sort(sortMatchesByStart)
      }));
  }, [matches, now]);

  function resolveKnockoutFields(match: Match, score: ScoreState, home: number, away: number) {
    if (!isKnockoutMatch(match) || !match.home_team_id || !match.away_team_id) {
      return { predictedWinnerTeamId: null, predictedDecidedBy: null };
    }

    return resolveKnockoutPredictionFields({
      homeGoals: home,
      awayGoals: away,
      predictedWinnerTeamId: score.predictedWinnerTeamId,
      predictedDecidedBy: score.predictedDecidedBy,
      homeTeamId: match.home_team_id,
      awayTeamId: match.away_team_id
    });
  }

  async function persistMatch(match: Match, nextScore: ScoreState) {
    const matchId = match.external_id;
    const home = parseScore(nextScore.homeGoals);
    const away = parseScore(nextScore.awayGoals);
    if (home === null || away === null) return;

    const knockout = isKnockoutMatch(match);
    const { predictedWinnerTeamId, predictedDecidedBy } = knockout
      ? resolveKnockoutFields(match, nextScore, home, away)
      : { predictedWinnerTeamId: null, predictedDecidedBy: null };

    if (knockout && (!predictedWinnerTeamId || !predictedDecidedBy)) {
      return;
    }

    const saved = savedBaseline.current[matchId];
    if (
      saved &&
      saved.homeGoals === home &&
      saved.awayGoals === away &&
      (saved.predictedWinnerTeamId ?? null) === predictedWinnerTeamId &&
      (saved.predictedDecidedBy ?? null) === predictedDecidedBy
    ) {
      setRowStatus((current) => ({ ...current, [matchId]: "saved" }));
      setRowErrors((current) => ({ ...current, [matchId]: null }));
      return;
    }

    if (inFlightSaves.current.has(matchId)) {
      pendingSaves.current[matchId] = nextScore;
      return;
    }

    inFlightSaves.current.add(matchId);
    setRowStatus((current) => ({ ...current, [matchId]: "saving" }));
    setRowErrors((current) => ({ ...current, [matchId]: null }));

    const result = await saveMatchPredictionAction({
      matchId,
      homeGoals: home,
      awayGoals: away,
      predictedWinnerTeamId,
      predictedDecidedBy
    });

    inFlightSaves.current.delete(matchId);

    if (result.ok) {
      removePredictionDraft(matchId);
      const now = new Date().toISOString();
      savedBaseline.current = {
        ...savedBaseline.current,
        [matchId]: {
          homeTeamId: match.home_team_id,
          awayTeamId: match.away_team_id,
          homeGoals: home,
          awayGoals: away,
          predictedWinnerTeamId: knockout ? predictedWinnerTeamId : undefined,
          predictedDecidedBy: knockout ? predictedDecidedBy : undefined,
          savedAt: now,
          locked: false,
          points: saved?.points ?? null
        }
      };
      setRowStatus((current) => ({ ...current, [matchId]: "saved" }));
      setRowErrors((current) => ({ ...current, [matchId]: null }));
    } else {
      setRowStatus((current) => ({ ...current, [matchId]: "error" }));
      setRowErrors((current) => ({
        ...current,
        [matchId]: result.error ?? "Erro ao salvar."
      }));
    }

    const pending = pendingSaves.current[matchId];
    if (pending) {
      delete pendingSaves.current[matchId];
      void persistMatch(match, pending);
    }
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

    const knockout = isKnockoutMatch(match);
    const { predictedWinnerTeamId, predictedDecidedBy } = knockout
      ? resolveKnockoutFields(match, nextScore, home, away)
      : { predictedWinnerTeamId: null, predictedDecidedBy: null };

    if (knockout && (!predictedWinnerTeamId || !predictedDecidedBy)) {
      setRowStatus((current) => ({ ...current, [matchId]: "idle" }));
      return;
    }

    upsertPredictionDraft(matchId, home, away, knockout ? {
      predictedWinnerTeamId,
      predictedDecidedBy
    } : undefined);
    setRowErrors((current) => ({ ...current, [matchId]: null }));

    if (saveTimers.current[matchId]) {
      clearTimeout(saveTimers.current[matchId]);
    }

    saveTimers.current[matchId] = setTimeout(() => {
      void persistMatch(match, {
        ...nextScore,
        predictedWinnerTeamId,
        predictedDecidedBy
      });
    }, 900);
  }

  useEffect(() => {
    if (flushDraftRef.current) return;
    flushDraftRef.current = true;

    const drafts = readPredictionDrafts();
    if (Object.keys(drafts).length === 0) return;

    for (const match of matches) {
      const draft = drafts[match.external_id];
      if (!draft) continue;

      const saved = savedPredictions[match.external_id];
      const alreadySaved =
        saved &&
        saved.homeGoals === draft.homeGoals &&
        saved.awayGoals === draft.awayGoals &&
        (saved.predictedWinnerTeamId ?? null) === (draft.predictedWinnerTeamId ?? null) &&
        (saved.predictedDecidedBy ?? null) === (draft.predictedDecidedBy ?? null);

      if (alreadySaved) {
        removePredictionDraft(match.external_id);
        continue;
      }

      if (isMatchLockedForPrediction(match)) continue;

      void persistMatch(match, {
        homeGoals: String(draft.homeGoals),
        awayGoals: String(draft.awayGoals),
        predictedWinnerTeamId: draft.predictedWinnerTeamId ?? null,
        predictedDecidedBy: draft.predictedDecidedBy ?? null
      });
    }
  }, [matches, savedPredictions]);

  function updateScore(match: Match, side: "homeGoals" | "awayGoals", value: string) {
    setScores((current) => {
      const previous = current[match.external_id] ?? toScoreState(match.external_id);
      const home =
        side === "homeGoals" ? value : previous.homeGoals;
      const away =
        side === "awayGoals" ? value : previous.awayGoals;
      const homeNum = parseScore(home);
      const awayNum = parseScore(away);

      let predictedWinnerTeamId = previous.predictedWinnerTeamId;
      let predictedDecidedBy = previous.predictedDecidedBy;

      if (
        isKnockoutMatch(match) &&
        homeNum !== null &&
        awayNum !== null &&
        match.home_team_id &&
        match.away_team_id
      ) {
        const resolved = resolveKnockoutPredictionFields({
          homeGoals: homeNum,
          awayGoals: awayNum,
          predictedWinnerTeamId,
          predictedDecidedBy,
          homeTeamId: match.home_team_id,
          awayTeamId: match.away_team_id
        });
        predictedWinnerTeamId = resolved.predictedWinnerTeamId;
        predictedDecidedBy = resolved.predictedDecidedBy;

        const methods = allowedDecisionMethods(homeNum, awayNum);
        if (
          predictedDecidedBy &&
          !methods.includes(predictedDecidedBy)
        ) {
          predictedDecidedBy = methods.length === 1 ? methods[0] : null;
        }
      }

      const nextScore = {
        homeGoals: home,
        awayGoals: away,
        predictedWinnerTeamId,
        predictedDecidedBy
      };
      const next = { ...current, [match.external_id]: nextScore };
      scheduleAutoSave(match, nextScore);
      return next;
    });
  }

  function updateWinner(match: Match, teamId: string) {
    setScores((current) => {
      const nextScore = {
        ...(current[match.external_id] ?? toScoreState(match.external_id)),
        predictedWinnerTeamId: teamId
      };
      const next = { ...current, [match.external_id]: nextScore };
      scheduleAutoSave(match, nextScore);
      return next;
    });
  }

  function updateMethod(match: Match, method: DecisionMethod) {
    setScores((current) => {
      const nextScore = {
        ...(current[match.external_id] ?? toScoreState(match.external_id)),
        predictedDecidedBy: method
      };
      const next = { ...current, [match.external_id]: nextScore };
      scheduleAutoSave(match, nextScore);
      return next;
    });
  }

  return (
    <div className="palpites-groups">
      {liveMatches.length > 0 ? (
        <section className="palpites-group palpites-group--live">
          <header className="palpites-group__head">
            <div>
              <h2>Jogos ao vivo</h2>
              <p className="palpites-group__subhead">Placar atualizado em tempo real</p>
            </div>
            <span>{liveMatches.length} jogos</span>
          </header>

          <div className="palpites-rows">
            {liveMatches.map((match) => (
              <PalpiteMatchRow
                key={`live-${match.external_id}`}
                current={scores[match.external_id] ?? { homeGoals: "", awayGoals: "" }}
                errorMessage={rowErrors[match.external_id]}
                match={match}
                now={now}
                onUpdateScore={updateScore}
                onWinnerChange={updateWinner}
                onMethodChange={updateMethod}
                saved={savedPredictions[match.external_id]}
                showGroupLabel
                status={rowStatus[match.external_id]}
              />
            ))}
          </div>
        </section>
      ) : null}

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
                errorMessage={rowErrors[match.external_id]}
                match={match}
                now={now}
                onUpdateScore={updateScore}
                onWinnerChange={updateWinner}
                onMethodChange={updateMethod}
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
                errorMessage={rowErrors[match.external_id]}
                match={match}
                now={now}
                onUpdateScore={updateScore}
                onWinnerChange={updateWinner}
                onMethodChange={updateMethod}
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
