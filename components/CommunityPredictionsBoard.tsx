"use client";

import { useEffect, useMemo, useState } from "react";
import { BracketPodiumSummary } from "@/components/BracketPodiumSummary";
import { formatDateTime } from "@/lib/date";
import { getMatchTeamLabel } from "@/lib/match-visibility";
import type { BracketPrediction, Match, Team } from "@/types/domain";

export type CommunityMemberSummary = {
  userId: string;
  username: string;
  totalPoints: number;
  savedMatches: number;
  hasBracket: boolean;
};

type MemberPredictions = {
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
  members: CommunityMemberSummary[];
  matches: Match[];
  teams: Team[];
  currentUserId?: string;
}) {
  const [selectedUserId, setSelectedUserId] = useState(
    members.find((member) => member.userId !== currentUserId)?.userId ?? members[0]?.userId ?? ""
  );
  const [predictionsByUser, setPredictionsByUser] = useState<Record<string, MemberPredictions>>({});
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const selected = members.find((member) => member.userId === selectedUserId) ?? members[0];
  const selectedPredictions = selected ? predictionsByUser[selected.userId] : undefined;

  useEffect(() => {
    if (!selectedUserId || predictionsByUser[selectedUserId]) return;

    let active = true;
    setLoadingUserId(selectedUserId);
    setLoadError(null);

    void fetch(`/api/comunidade/predictions?userId=${encodeURIComponent(selectedUserId)}`, {
      cache: "no-store"
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Nao foi possivel carregar os palpites.");
        }
        return (await response.json()) as MemberPredictions;
      })
      .then((payload) => {
        if (!active) return;
        setPredictionsByUser((current) => ({
          ...current,
          [selectedUserId]: payload
        }));
      })
      .catch((error: Error) => {
        if (!active) return;
        setLoadError(error.message);
      })
      .finally(() => {
        if (active) setLoadingUserId(null);
      });

    return () => {
      active = false;
    };
  }, [predictionsByUser, selectedUserId]);

  const visibleMatches = useMemo(() => {
    if (!selectedPredictions) return [];
    return matches.filter((match) => selectedPredictions.matchPredictions[match.external_id]);
  }, [matches, selectedPredictions]);

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

        {loadingUserId === selected.userId ? (
          <section className="card">
            <p className="muted">Carregando palpites...</p>
          </section>
        ) : null}

        {loadError ? (
          <section className="card">
            <p className="error">{loadError}</p>
          </section>
        ) : null}

        {selectedPredictions?.bracket?.championTeamId ? (
          <BracketPodiumSummary
            bracket={selectedPredictions.bracket}
            teams={teams}
            title={`Podio de ${selected.username}`}
          />
        ) : null}

        <section className="card community-matches">
          <div className="community-matches__head">
            <span className="eyebrow">Jogos palpitados</span>
            <strong>{visibleMatches.length}</strong>
          </div>

          {!selectedPredictions && loadingUserId !== selected.userId ? (
            <p className="muted">Selecione um participante para ver os palpites.</p>
          ) : visibleMatches.length === 0 && selectedPredictions ? (
            <p className="muted">Esse participante ainda nao salvou palpites de jogos.</p>
          ) : (
            <div className="community-match-list">
              {visibleMatches.map((match) => {
                const prediction = selectedPredictions?.matchPredictions[match.external_id];
                if (!prediction) return null;

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
