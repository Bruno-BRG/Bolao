"use client";

import { useMemo } from "react";
import { formatCompactDateTime } from "@/lib/date";
import {
  KNOCKOUT_ROUNDS,
  KNOCKOUT_THIRD_PLACE_MATCH_ID,
  type BracketRound
} from "@/lib/knockout-bracket-tree";
import { getDisplayOfficialScore } from "@/lib/match-score";
import { isMatchFinished, isMatchLive } from "@/lib/match-status";
import { getMatchTeamLabel, isMatchPredictable } from "@/lib/match-visibility";
import type { Match } from "@/types/domain";

type KnockoutBracketBoardProps = {
  matches: Match[];
};

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
        <p className="muted">A definir</p>
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
        {!live && !isMatchPredictable(match) ? (
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

function BracketColumn({
  round,
  matchMap,
  isLast
}: {
  round: BracketRound;
  matchMap: Map<string, Match>;
  isLast: boolean;
}) {
  return (
    <section className={`bracket-col bracket-col--${round.id}`}>
      <h3 className="bracket-col__title">{round.title}</h3>
      <div className="bracket-col__slots">
        {round.matchIds.map((matchId, index) => {
          const isUpper = index % 2 === 0;
          return (
            <div
              key={matchId}
              className={`bracket-slot${isLast ? " bracket-slot--last" : ""}${
                isUpper ? " bracket-slot--upper" : " bracket-slot--lower"
              }`}
            >
              <BracketMatchCard match={matchMap.get(matchId)} />
              {!isLast && isUpper ? (
                <span className="bracket-slot__link" aria-hidden="true" />
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function KnockoutBracketBoard({ matches }: KnockoutBracketBoardProps) {
  const matchMap = useMemo(() => buildMatchMap(matches), [matches]);
  const thirdPlace = matchMap.get(KNOCKOUT_THIRD_PLACE_MATCH_ID);

  return (
    <div className="bracket-shell">
      <div className="bracket-scroll">
        <div className="bracket-board">
          {KNOCKOUT_ROUNDS.map((round, index) => (
            <BracketColumn
              key={round.id}
              round={round}
              matchMap={matchMap}
              isLast={index === KNOCKOUT_ROUNDS.length - 1}
            />
          ))}
        </div>
      </div>

      {thirdPlace ? (
        <section className="bracket-third">
          <h3 className="bracket-col__title">Disputa de 3º lugar</h3>
          <div className="bracket-third__card">
            <BracketMatchCard match={thirdPlace} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
