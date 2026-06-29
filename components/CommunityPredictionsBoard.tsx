"use client";

import { useMemo, useState } from "react";
import { BracketPodiumSummary } from "@/components/BracketPodiumSummary";
import { formatDateTime } from "@/lib/date";
import { getMatchTeamLabel } from "@/lib/match-visibility";
import type { BracketPrediction, Match, Team } from "@/types/domain";

export type CommunityMember = {
  userId: string;
  username: string;
  totalPoints: number;
  savedMatches: number;
  bracket: BracketPrediction | null;
  matchPredictions: Record<
    string,
    {
      homeGoals: number;
      awayGoals: number;
      points: number | null;
    }
  >;
};

export function CommunityPredictionsBoard({
  members,
  matches,
  teams,
  currentUserId
}: {
  members: CommunityMember[];
  matches: Match[];
  teams: Team[];
  currentUserId?: string;
}) {
  const [selectedUserId, setSelectedUserId] = useState(
    members.find((member) => member.userId !== currentUserId)?.userId ?? members[0]?.userId ?? ""
  );

  const selected = members.find((member) => member.userId === selectedUserId) ?? members[0];
  const visibleMatches = useMemo(() => {
    if (!selected) return [];
    return matches.filter((match) => selected.matchPredictions[match.external_id]);
  }, [matches, selected]);

  if (members.length === 0) {
    return (
      <section className="card">
        <p className="muted">Ninguem salvou palpites ainda.</p>
      </section>
    );
  }

  if (!selected) return null;

  return (
    <div className="community-board">
      <aside className="community-board__users card">
        <div className="community-board__users-head">
          <span className="eyebrow">Participantes</span>
          <strong>{members.length}</strong>
        </div>
        <div className="community-user-list">
          {members.map((member) => (
            <button
              key={member.userId}
              className={`community-user ${member.userId === selected.userId ? "active" : ""}`}
              onClick={() => setSelectedUserId(member.userId)}
              type="button"
            >
              <span>{member.username}</span>
              <small>{member.totalPoints} pts · {member.savedMatches} jogos</small>
            </button>
          ))}
        </div>
      </aside>

      <section className="community-board__detail">
        <header className="community-board__detail-head card">
          <div>
            <span className="eyebrow">Palpites de</span>
            <h2>{selected.username}</h2>
          </div>
          <div className="community-board__stats">
            <span className="badge">{selected.totalPoints} pts</span>
            <span className="badge">{selected.savedMatches} jogos</span>
          </div>
        </header>

        {selected.bracket?.championTeamId ? (
          <BracketPodiumSummary
            bracket={selected.bracket}
            teams={teams}
            title={`Podio de ${selected.username}`}
          />
        ) : null}

        <section className="card community-matches">
          <div className="community-matches__head">
            <span className="eyebrow">Jogos palpitados</span>
            <strong>{visibleMatches.length}</strong>
          </div>

          {visibleMatches.length === 0 ? (
            <p className="muted">Esse participante ainda nao salvou palpites de jogos.</p>
          ) : (
            <div className="community-match-list">
              {visibleMatches.map((match) => {
                const prediction = selected.matchPredictions[match.external_id];
                return (
                  <article key={match.external_id} className="community-match-row">
                    <div className="community-match-row__meta">
                      <span>{match.group_name ?? match.stage ?? "Jogo"}</span>
                      <time>{formatDateTime(match.starts_at)}</time>
                    </div>
                    <div className="community-match-row__teams">
                      <span className="community-match-row__team community-match-row__team--home">
                        {getMatchTeamLabel(match, "home")}
                      </span>
                      <strong className="community-match-row__score">
                        {prediction.homeGoals} x {prediction.awayGoals}
                      </strong>
                      <span className="community-match-row__team community-match-row__team--away">
                        {getMatchTeamLabel(match, "away")}
                      </span>
                    </div>
                    {prediction.points !== null && prediction.points !== undefined ? (
                      <span className="badge warning">{prediction.points} pts</span>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
