"use client";

import { useMemo, useState } from "react";
import { formatCompactDateTime } from "@/lib/date";
import {
  BRACKET_HALVES,
  BOTTOM_BRACKET_HALF,
  KNOCKOUT_FINAL_MATCH_ID,
  KNOCKOUT_THIRD_PLACE_MATCH_ID,
  TOP_BRACKET_HALF,
  type BracketHalf,
  type BracketPair
} from "@/lib/knockout-bracket-tree";
import { getDisplayOfficialScore } from "@/lib/match-score";
import { isMatchFinished, isMatchLive } from "@/lib/match-status";
import { getMatchTeamLabel, isMatchPredictable } from "@/lib/match-visibility";
import type { Match } from "@/types/domain";

type KnockoutBracketBoardProps = {
  matches: Match[];
};

type BracketView = "top" | "bottom" | "final";

function buildMatchMap(matches: Match[]) {
  return new Map(matches.map((match) => [match.external_id, match]));
}

function teamWonSide(match: Match, side: "home" | "away") {
  if (!isMatchFinished(match)) return false;
  if (match.score_home == null || match.score_away == null) return false;
  if (match.score_home === match.score_away) return false;
  return side === "home"
    ? match.score_home > match.score_away
    : match.score_away > match.score_home;
}

function BracketTeamRow({
  flagUrl,
  label,
  score,
  winner
}: {
  flagUrl: string | null | undefined;
  label: string;
  score: string | null;
  winner: boolean;
}) {
  return (
    <div className={`bracket-team${winner ? " bracket-team--winner" : ""}`}>
      <span className="bracket-team__crest" aria-hidden="true">
        {flagUrl ? (
          <img className="flag-icon flag-icon--sm" src={flagUrl} alt="" loading="lazy" />
        ) : (
          <span className="bracket-team__placeholder" />
        )}
      </span>
      <span className="bracket-team__name">{label}</span>
      {score !== null ? <span className="bracket-team__score">{score}</span> : null}
    </div>
  );
}

function BracketMatchCard({ match }: { match: Match | undefined }) {
  if (!match) {
    return (
      <article className="bracket-card bracket-card--empty">
        <p className="muted">Jogo nao encontrado</p>
      </article>
    );
  }

  const live = isMatchLive(match);
  const finished = isMatchFinished(match);
  const official = getDisplayOfficialScore(match);
  const homeScore = official ? String(official.home) : null;
  const awayScore = official ? String(official.away) : null;

  return (
    <article
      className={`bracket-card${live ? " bracket-card--live" : ""}${finished ? " bracket-card--finished" : ""}`}
    >
      <header className="bracket-card__head">
        <time dateTime={match.starts_at}>{formatCompactDateTime(match.starts_at)}</time>
        {live ? <span className="badge live">Ao vivo</span> : null}
        {!isMatchPredictable(match) ? (
          <span className="badge locked">A definir</span>
        ) : null}
      </header>
      <div className="bracket-card__teams">
        <BracketTeamRow
          flagUrl={match.home_team?.flag_url}
          label={getMatchTeamLabel(match, "home")}
          score={homeScore}
          winner={teamWonSide(match, "home")}
        />
        <BracketTeamRow
          flagUrl={match.away_team?.flag_url}
          label={getMatchTeamLabel(match, "away")}
          score={awayScore}
          winner={teamWonSide(match, "away")}
        />
      </div>
    </article>
  );
}

function BracketR32Pair({
  pair,
  matchMap
}: {
  pair: BracketPair;
  matchMap: Map<string, Match>;
}) {
  return (
    <div className="bracket-slot bracket-slot--pair">
      <BracketMatchCard match={matchMap.get(pair.topMatchId)} />
      <BracketMatchCard match={matchMap.get(pair.bottomMatchId)} />
    </div>
  );
}

function BracketHalfBoard({
  half,
  matchMap
}: {
  half: BracketHalf;
  matchMap: Map<string, Match>;
}) {
  return (
    <div className="bracket-board" role="list" aria-label={half.label}>
      <section className="bracket-column">
        <h3 className="bracket-round__title">32 avos</h3>
        <div className="bracket-column__slots">
          {half.r32Pairs.map((pair) => (
            <BracketR32Pair
              key={`${pair.topMatchId}-${pair.bottomMatchId}`}
              pair={pair}
              matchMap={matchMap}
            />
          ))}
        </div>
      </section>

      <section className="bracket-column">
        <h3 className="bracket-round__title">Oitavas</h3>
        <div className="bracket-column__slots">
          {half.r16MatchIds.map((matchId) => (
            <div key={matchId} className="bracket-slot">
              <BracketMatchCard match={matchMap.get(matchId)} />
            </div>
          ))}
        </div>
      </section>

      <section className="bracket-column">
        <h3 className="bracket-round__title">Quartas</h3>
        <div className="bracket-column__slots">
          {half.qfMatchIds.map((matchId) => (
            <div key={matchId} className="bracket-slot">
              <BracketMatchCard match={matchMap.get(matchId)} />
            </div>
          ))}
        </div>
      </section>

      <section className="bracket-column">
        <h3 className="bracket-round__title">Semifinal</h3>
        <div className="bracket-column__slots">
          <div className="bracket-slot">
            <BracketMatchCard match={matchMap.get(half.semifinalMatchId)} />
          </div>
        </div>
      </section>
    </div>
  );
}

function BracketFinalBoard({ matchMap }: { matchMap: Map<string, Match> }) {
  return (
    <div className="bracket-finals">
      <section className="bracket-finals__block">
        <h3 className="bracket-round__title">Semifinais</h3>
        <div className="bracket-finals__semis">
          <BracketMatchCard match={matchMap.get(TOP_BRACKET_HALF.semifinalMatchId)} />
          <BracketMatchCard match={matchMap.get(BOTTOM_BRACKET_HALF.semifinalMatchId)} />
        </div>
      </section>

      <section className="bracket-finals__block bracket-finals__block--highlight">
        <h3 className="bracket-round__title">Final</h3>
        <BracketMatchCard match={matchMap.get(KNOCKOUT_FINAL_MATCH_ID)} />
      </section>

      <section className="bracket-finals__block">
        <h3 className="bracket-round__title">3º lugar</h3>
        <BracketMatchCard match={matchMap.get(KNOCKOUT_THIRD_PLACE_MATCH_ID)} />
      </section>
    </div>
  );
}

export function KnockoutBracketBoard({ matches }: KnockoutBracketBoardProps) {
  const [view, setView] = useState<BracketView>("top");
  const matchMap = useMemo(() => buildMatchMap(matches), [matches]);

  return (
    <div className="bracket-shell">
      <div className="bracket-tabs" role="tablist" aria-label="Chaveamento">
        {BRACKET_HALVES.map((half) => (
          <button
            key={half.id}
            type="button"
            role="tab"
            aria-selected={view === half.id}
            className={`bracket-tab${view === half.id ? " bracket-tab--active" : ""}`}
            onClick={() => setView(half.id)}
          >
            {half.label}
          </button>
        ))}
        <button
          type="button"
          role="tab"
          aria-selected={view === "final"}
          className={`bracket-tab${view === "final" ? " bracket-tab--active" : ""}`}
          onClick={() => setView("final")}
        >
          Final
        </button>
      </div>

      <div className="bracket-scroll">
        {view === "top" ? <BracketHalfBoard half={TOP_BRACKET_HALF} matchMap={matchMap} /> : null}
        {view === "bottom" ? (
          <BracketHalfBoard half={BOTTOM_BRACKET_HALF} matchMap={matchMap} />
        ) : null}
        {view === "final" ? <BracketFinalBoard matchMap={matchMap} /> : null}
      </div>
    </div>
  );
}
